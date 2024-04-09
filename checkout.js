//load required modules 
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const readlineSync = require('readline-sync');

//loads the Protocol Buffer definition file named Checkout.proto
const packageDefinition = protoLoader.loadSync('Checkout.proto', {});
//loads the gRPC package definition from the packageDefinition
const smartretail = grpc.loadPackageDefinition(packageDefinition) .smartretail;

//creates new gRPC client for checkout service and specifies the address and port of the gRPC server
const checkoutClient = new smartretail.Checkout(
    '127.0.0.1:50051',
    grpc.credentials.createInsecure(),
);

//function for calculating total cost of products in shopping cart
function calculateTotal (products){
    const cart = {
        products: products
    }
//error handling for checkout to log to console
checkoutClient.calculateTotal(cart, (error, response) => {
    if (error){
        console.error("Error calculating total:", error.message);
        return;
    }
    console.log("Total cost:", response.total);
});
};

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
function verifyCreditCard(){
    const cardNumber = readlineSync.question("Enter your card number: ");
    const expiryDate = readlineSync.question("Enter expiry date (MM/YY): ");
    const cvv = readlineSync.question("Enter CVV:");

    //credit/debit card validation logic
    const cardNumberIsValid = cardNumber.length >=16;
    const expiryDateIsValid = /^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(expiryDate);
    const cvvIsValid = cvv.length === 3;

    if (cardNumberIsValid && expiryDateIsValid && cvvIsValid) {
        console.log("Credit/debit card details are valid.");
        //conitune with processing
    } else {
        console.log("Invalid credit/debit card details have been entered. Please check again");
    }
}
//call the function to add products to the cart
addToCart();
//call the function to prompt for credit/debit card details
verifyCreditCard();
