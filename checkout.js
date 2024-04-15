//import necessary modules
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const readlineSync = require('readline-sync');

// Load the Protocol Buffer definition file named Checkout.proto
const packageDefinition = protoLoader.loadSync('Checkout.proto');

// Load the gRPC package definition from the packageDefinition
const smartretail = grpc.loadPackageDefinition(packageDefinition).smartretail;

// Create new gRPC client for checkout service and specify the address and port of the gRPC server
const checkoutClient = new smartretail.Checkout('127.0.0.1:50051', grpc.credentials.createInsecure());

// Function for calculating total cost of products in shopping cart
function calculateTotal(products) {
    const cart = {
        items: products
    };
    const call = checkoutClient.ProcessCheckout();

    call.on('data', function(response) {
        if (response.totalResponse && response.totalResponse.total !== undefined) {
            const formattedTotal = "\u20AC" + response.totalResponse.total.toFixed(2);
            console.log('Your card has been verified and purchase accepted.\n' + 'The total cost of your cart is:', formattedTotal);
        } else {
            console.log('Unexpected response from server:', response);
        }
    });

    call.on('end', function() {
        console.log('Server has finished processing the checkout.');
    });

    // Send cart items to the server
    call.write({ cart });
    // Indicate the end of data
    call.end();
}

// Function to add products to the cart
function addToCart() {
    let addProduct = readlineSync.keyInYN('Would you like to enter a product? ');
    const products = [];

    while (addProduct) {
        const id = readlineSync.question('Enter product ID: ');
        const name = readlineSync.question('Enter product name: ');
        const price = parseFloat(readlineSync.question('Enter product price: '));
        const quantity = parseInt(readlineSync.question('Enter product quantity: '));

        products.push({ id, name, price, quantity });

        addProduct = readlineSync.keyInYN('Do you want to add another product? ');
    }
    // After adding all products, proceed to calculate total with products array
    calculateTotal(products);
}

// Function to verify credit/debit cards
function verifyCreditCard() {
    const cardNumber = readlineSync.question("Enter your card number: ");
    const expiryDate = readlineSync.question("Enter expiry date (MM/YY): ");
    const cvv = readlineSync.question("Enter CVV:");

    const paymentInfo = {
        cardNumber: cardNumber,
        expiryDate: expiryDate,
        cvv: cvv
    };

    // Call the VerifyCard RPC method
    checkoutClient.VerifyCard(paymentInfo, (error, response) => {
        if (error) {
            console.error('Error verifying card:', error.message);
            return;
        }
        if(response.isValid) {
            console.log("Credit/debit card details are valid.");
            // Proceed to add products to cart and calculate total cost
            addToCart();
        } else {
            console.log("Invalid credit/debit card details have been entered. Please check again.");
        }
    });
}



 // Function to start chat session
 function startChatSession() {
    const chatClient = new smartretail.CheckoutChat(
        '127.0.0.1:50051',
        grpc.credentials.createInsecure(),
    );

    const chatStream = chatClient.Chat();

    chatStream.on('data', function(message) {
        console.log(`[${message.user}]: ${message.message}`);
    });

    chatStream.on('end', function() {
        console.log('Server has ended the chat.');
    });

    // Use readline-sync for user input
    function getUserInput() {
        const message = readlineSync.question('Enter your message or type "exit" to end the chat: ');
        if (message.toLowerCase() === 'exit') {
            chatStream.end();
            // Return from the function immediately after ending the chat
            return; 
        } else {
            chatStream.write({ user: 'CheckoutClient', message: message });
            //call this function again to get the next message
            getUserInput(); 
        }
    }
    //start the chat by getting the user's input
    getUserInput(); 
}

// Function for user input
function main() {
    console.log("Welcome to the Checkout System");
    console.log("1. Add product to cart");
    console.log("2. Start chat with server");
    console.log("3. Exit");
    const choice = readlineSync.question("Enter your choice: ");

    // Switch statement executes different actions based on user choice
    switch (choice) {
        case '1':
            addToCart();
            // After adding products ask for card details
            verifyCreditCard();
            break;
        case '2':
            startChatSession();
            break;
        case '3':
            // Exits the app
            console.log('Exit application');
            process.exit(0);
            break;
        default:
            // Asks for correct input
            console.log('Invalid choice please enter 1 2 or 3');
            main();
    }
}

// Entry point where execution of code begins 
main();

