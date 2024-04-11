//define the terminalStyler object
const terminalStyler = {
    // Styles for text colors
    black: (text) => `\x1b[30m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    magenta: (text) => `\x1b[35m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    white: (text) => `\x1b[37m${text}\x1b[0m`,

    //styles for background colors
    bgBlack: (text) => `\x1b[40m${text}\x1b[0m`,
    bgRed: (text) => `\x1b[41m${text}\x1b[0m`,
    bgGreen: (text) => `\x1b[42m${text}\x1b[0m`,
    bgYellow: (text) => `\x1b[43m${text}\x1b[0m`,
    bgBlue: (text) => `\x1b[44m${text}\x1b[0m`,
    bgMagenta: (text) => `\x1b[45m${text}\x1b[0m`,
    bgCyan: (text) => `\x1b[46m${text}\x1b[0m`,
    bgWhite: (text) => `\x1b[47m${text}\x1b[0m`,

    //other styles
    bold: (text) => `\x1b[1m${text}\x1b[0m`,
    italic: (text) => `\x1b[3m${text}\x1b[0m`,
    underline: (text) => `\x1b[4m${text}\x1b[0m`,
    dim: (text) => `\x1b[2m${text}\x1b[0m`,
    reset: (text) => `\x1b[0m${text}\x1b[0m`, 
};

//load required modules 
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const readlineSync = require('readline-sync');

//loads the Protocol Buffer definition file named Checkout.proto
const packageDefinition = protoLoader.loadSync('Checkout.proto', {});
//loads the gRPC package definition from the packageDefinition
const smartretail = grpc.loadPackageDefinition(packageDefinition).smartretail;

//creates new gRPC client for checkout service and specifies the address and port of the gRPC server
const checkoutClient = new smartretail.Checkout(
    '127.0.0.1:50051',
    grpc.credentials.createInsecure(),
);

//function for calculating total cost of products in shopping cart
function calculateTotal(products) {
    const cart = {
        items: products
    };
    checkoutClient.calculateTotal(cart, (error, response) => {
        if (error) {
            console.error(terminalStyler.red('Error calculating total:'), terminalStyler.red(error.message));
            return;
        }
        
        //round the total cost to two decimal places and concatenate with euro symbol
        const formattedTotal = "\u20AC" + response.total.toFixed(2);

        //log formatted total to console
        console.log(terminalStyler.cyan('The total cost of your cart is:'), terminalStyler.cyan(formattedTotal));
    });
}

module.exports = { calculateTotal };

//function to add products to the cart
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

    //after adding all products proceed to calculate total with products array
    calculateTotal(products);
}

//create function to verify credit/debit cards
function verifyCreditCard() {
    const cardNumber = readlineSync.question("Enter your card number: ");
    const expiryDate = readlineSync.question("Enter expiry date (MM/YY): ");
    const cvv = readlineSync.question("Enter CVV:");

    // Check if the card number length is 16 digits
    if (!cardNumber || cardNumber.length !== 16 || isNaN(parseInt(cardNumber, 10))) {
        console.log(terminalStyler.red("Invalid credit/debit card details have been entered. Please check again."));
        return; // Exit the function if the card number is not valid
    }

    //construct PaymentInfo message
    const paymentInfo = {
        cardNumber: cardNumber,
        expiryDate: expiryDate,
        cvv: cvv
    };

    //call the VerifyCard RPC method
    checkoutClient.VerifyCard(paymentInfo, (error, response) => {
        if (error) {
            console.error(terminalStyler.red('Error verifying card:'), terminalStyler.red(error.message));
            return;
        }
        if (response.isValid) {
            console.log(terminalStyler.green("Credit/debit card details are valid."));
            //continue with processing
        } else {
            console.log(terminalStyler.red("Invalid credit/debit card details have been entered. Please check again."));
        }
    });
}

//call the function to add products to the cart
addToCart();
//call the function to prompt for credit/debit card details
verifyCreditCard();