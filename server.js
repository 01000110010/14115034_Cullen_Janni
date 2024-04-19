//load necessary modules
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

//load Protocol Buffer definitions for StockControl Checkout and CustomerService services
const packageDefinition = protoLoader.loadSync('StockControl.proto');
const checkoutPackageDefinition = protoLoader.loadSync('Checkout.proto');
const customerServicePackageDefinition = protoLoader.loadSync('CustomerService.proto');

//load gRPC package definitions
const smartretail = grpc.loadPackageDefinition(packageDefinition).smartretail;
const checkoutPackage = grpc.loadPackageDefinition(checkoutPackageDefinition).smartretail;
const customerServicePackage = grpc.loadPackageDefinition(customerServicePackageDefinition).smartretail;

//define opening times for customer service
const customerServiceOpeningTimes = "9am to 9pm";
//define the delivery cost
const deliveryCost = "5.99"; 

//array to store products
let products = [];

//addProduct function
function addProduct(call, callback) {
    console.log('Adding product:', call.request);
    const productData = {
        id: call.request.id,
        name: call.request.name,
        price: call.request.price,
        quantity: call.request.quantity
    };
    products.push(productData);
    console.log('Product data added to array successfully');
    callback(null, { id: call.request.id, message: 'Product added successfully' });
}

//function to retrieve products
function getProducts(call, callback) {
    console.log('Retrieving products');
    callback(null, { products });
}

//implementation for bidirectional streaming RPC for processing checkout
function processCheckout(call) {
    let cardValid = false;

    call.on('data', function(request) {
        const { cart, paymentInfo } = request;

        verifyCard(paymentInfo, (error, response) => {
            if (error) {
                console.error('Error verifying card:', error.message);
                return;
            }
            cardValid = response.isValid;
            //send response based on card validity
            if (cardValid) {
                let total = 0;
                cart.items.forEach(item => {
                    total += item.price * item.quantity;
                });
                //send response with total if card is valid
                call.write({ totalResponse: { total: total }, cardVerificationResponse: { isValid: cardValid } });
            } else {
                //send response indicating card is invalid
                call.write({ cardVerificationResponse: { isValid: cardValid, message: "Invalid credit/debit card details have been entered. Please check again" } });
            }
        });
    });
    //client has stopped
    console.log('Client finished sending data.');
    call.on('end', function() {
        call.end();
    });
}

//implementation for verifying credit/debit cards
function verifyCard(paymentInfo, callback) {
    const { cardNumber, expiryDate, cvv } = paymentInfo;
    const cardNumberIsValid = cardNumber.length >= 16;
    const expiryDateIsValid = /^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(expiryDate);
    const cvvIsValid = cvv.length === 3;

    if (cardNumberIsValid && expiryDateIsValid && cvvIsValid) {
        console.log("Credit/debit card details are valid.");
        //send success response to client
        callback(null, { isValid: true, message: "Card is valid" });
    } else {
        console.log("Invalid credit/debit card details have been entered. Please check again");
        //send failure response to client
        callback(null, { isValid: false, message: "Card is invalid" });
    }
}

//implementation for bidirectional streaming RPC for chat
function chat(call) {
    call.on('data', function(chatMessage) {
        console.log(`Received message from ${chatMessage.user}: ${chatMessage.message}`);
        //respond back to the client with an acknowledgment
        call.write({ user: 'Server', message: `Message received: ${chatMessage.message}` });
    });

    call.on('end', function() {
        call.end();
    });
}  

//implementation for customerService service
function askQuestion(call, callback) {
    const { questionType } = call.request;

    switch (questionType) {
        //question about delivery  
        case 1: 
            callback(null, { message: `The delivery cost is ${deliveryCost}.` });
            break;
            //question about opening hours
        case 2: 
            callback(null, { message: `Customer service is open ${customerServiceOpeningTimes}.` });
            break;
        default:
            callback({ code: grpc.status.INVALID_ARGUMENT, message: 'Invalid question type.' });
    }
}

//create gRPC server instance
const server = new grpc.Server();

//add services to the gRPC server
server.addService(smartretail.StockControl.service, {
    AddProduct: addProduct,
    GetProducts: getProducts
});

server.addService(smartretail.ChatService.service, { 
    Chat: chat 
});

server.addService(checkoutPackage.Checkout.service, {
    ProcessCheckout: processCheckout
});

server.addService(customerServicePackage.CustomerService.service, {
    AskQuestion: askQuestion,
    Chat: chat 
});
server.addService(checkoutPackage.CheckoutChat.service, {
    Chat: chat
});
server.addService(customerServicePackage.CustomerServiceChat.service, {
    Chat: chat 
});

//define port number
const port = '50051';

//bind server to port
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
        console.error('Server error:', error);
        return;
    }
    console.log(`Server running at http://0.0.0.0:${port}`);
});
