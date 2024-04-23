//load necessary modules
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const readlineSync = require('readline-sync');

//load the Protocol Buffer definition file named Checkout.proto
const packageDefinition = protoLoader.loadSync('Checkout.proto');

//load the gRPC package definition from the packageDefinition
const smartretail = grpc.loadPackageDefinition(packageDefinition).smartretail;

//create a new gRPC client for the checkout service and specify the address and port of the gRPC server
const checkoutClient = new smartretail.Checkout('127.0.0.1:50051', grpc.credentials.createInsecure());

//function for calculating the total cost of products in the shopping cart
function calculateTotal(products) {
    return new Promise((resolve, reject) => {
        const cart = {
            items: products
        };

        //flag to track card validation
        let cardValid = false;

        //create a bidirectional stream for checkout
        const call = checkoutClient.ProcessCheckout();

        call.on('data', function(response) {
            if (response.totalResponse && response.totalResponse.total !== undefined) {
                const formattedTotal = "\u20AC" + response.totalResponse.total.toFixed(2);
                console.log('Total cost of your cart:', formattedTotal);
                if (response.cardVerificationResponse) {
                    if (response.cardVerificationResponse.isValid) {
                        console.log('Your card has been verified.');
                        console.log('Purchase accepted.');
                        console.log('Your order has been sent to the warehouse for picking');
                        cardValid = true; 
                    } else {
                        console.log('Card verification failed. Please check your card details.');
                    }
                }
            }
        });

        call.on('end', function() {
            //resolve the promise only if the card is valid
            if (cardValid) {
                resolve();
            } else {
                //reject the promise if the card is invalid
                reject(new Error('Invalid credit/debit card details have been entered. Please check again'));
            }
        });

        //send cart items and card details to the server
        call.write({
            cart,
            paymentInfo: getCardDetails()
        });

        //indicate the end of data
        call.end();
    });
}

//function to get card details from user input
function getCardDetails() {
    const cardNumber = readlineSync.question("Enter your card number: ");
    const expiryDate = readlineSync.question("Enter expiry date (MM/YY): ");
    const cvv = readlineSync.question("Enter CVV:");

    return {
        cardNumber: cardNumber,
        expiryDate: expiryDate,
        cvv: cvv
    };
}

//function to add products to the cart
async function addToCart() {
    let addProduct = readlineSync.keyInYN('Would you like to enter a product? ');
    const products = [];

    while (addProduct) {
        const id = readlineSync.question('Enter product ID: ');
        const name = readlineSync.question('Enter product name: ');
        const price = parseFloat(readlineSync.question('Enter product price: '));
        const quantity = parseInt(readlineSync.question('Enter product quantity: '));

        products.push({
            id,
            name,
            price,
            quantity
        });

        addProduct = readlineSync.keyInYN('Do you want to add another product? ');
    }

    //check if any products were added
    if (products.length === 0) {
        console.log('No products added to cart. Please add products to continue.');
        //automatically call addToCart again to prompt the user to add products
        await addToCart();
    } else {
        //if products were added proceed to calculate the total
        return calculateTotal(products).catch((error) => {
            console.error(error.message);
            return addToCart();
        });
    }
}

//function to start chat session
function startChatSession() {
    return new Promise((resolve, reject) => {
        const chatClient = new smartretail.CheckoutChat('127.0.0.1:50051',
            grpc.credentials.createInsecure(),
        );

        const chatStream = chatClient.Chat();

        chatStream.on('data', function(message) {
            console.log(`${message.user}: ${message.message}`);
        });

        chatStream.on('end', function() {
            console.log('Server has ended the chat.');
            resolve();
        });

        //use readline-sync for user input
        function getUserInput() {
            const message = readlineSync.question('Enter your message or type "exit" to end the chat: ');
            if (message.toLowerCase() === 'exit') {
                chatStream.end();
                //return from the function immediately after ending the chat
                return;
            } else {
                chatStream.write({
                    user: 'CheckoutClient',
                    message: message
                });
                //call this function again to get the next message
                getUserInput();
            }
        }

        //start the chat by getting the user's input
        getUserInput();
    });
}

//function for user input
async function main() {
    let continueShopping = true;
    while (continueShopping) {
        console.log("Welcome to the Checkout System");
        console.log("1. Add product to cart");
        console.log("2. Start chat with server");
        console.log("3. Exit");
        const choice = readlineSync.question("Enter your choice: ");

        //switch statement executes different actions based on user choice
        switch (choice) {
            case '1':
                //add products to cart
                await addToCart();
                //after adding products ask for card details
                break;
            case '2':
                //start chat session
                await startChatSession();
                break;
            case '3':
                //exit the application
                console.log('Exit application');
                process.exit(0);
                break;
            default:
                //ask for correct input
                console.log('Invalid choice please enter 1, 2, or 3');
                main();
        }

        //ask the user if they want to perform another action
        continueShopping = readlineSync.keyInYN('Would you like to perform another action? ');
    }
}

//entry point where execution of code begins 
main();

