//load required modules 
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const readlineSync = require('readline-sync');

//loads the Protocol Buffer definition file named StockControl.proto
const packageDefinition = protoLoader.loadSync('StockControl.proto', {});
//loads the gRPC package definition from the packageDefinition
const smartretail = grpc.loadPackageDefinition(packageDefinition).smartretail;

//creates new gRPC client for StockControl service and specifies the address and port of the gRPC server
const stockControlClient = new smartretail.StockControl('127.0.0.1:50051', grpc.credentials.createInsecure(), );

//create function to add product and prompts user to enter product details
function addProduct() {
    const id = readlineSync.question('Enter product ID :');
    const name = readlineSync.question('Enter product name :');
    const price = parseFloat(readlineSync.question('Enter product price: '));
    const quantity = parseInt(readlineSync.question('Enter product quantity: '));

    const product = {
        id,
        name,
        price,
        quantity
    };

    //call the AddProduct RPC which gives error or success message to client
    stockControlClient.AddProduct(product, (error, response) => {
        if (error) {
            console.error('Error adding product', error.message);
            return;
        }
        console.log('Product was added successfully', response.message);
        //add products to the array
        products.push(product);
        //function to add another product asking user for input of Y or N 
        const anotherProduct = readlineSync.keyInYN('Do you want to add another product? ');
        if (anotherProduct) {
            //y adds product
            addProduct();
        } else {
            //n exits application
            //ask if the user wants to perform another action
            askForAnotherAction();
        }
    });
}

//create and initialize empty array
const products = [];

//main function for user interaction with application with multiple choices
function main() {
    console.log("Welcome to the Stock Control Client");
    console.log("1. Add product");
    console.log("2. Retrieve products");
    console.log("3. Start chat");
    console.log("4. Exit");
    const choice = readlineSync.question("Enter your choice: ");

    switch (choice) {
        case '1':
            addProduct();
            break;
        case '2':
            retrieveProducts();
            break;
        case '3':
            startChat();
            break;
        case '4':
            console.log('Exit application');
            process.exit(0);
        default:
            console.log('Incorrect key');
            break;
    }
}
//function for retreiving products
function retrieveProducts() {
    stockControlClient.GetProducts({}, (error, response) => {
        if (error) {
            console.error('Error retrieving products', error.message);
            return;
        }
        if (response.products && response.products.length > 0) {
            console.log('Products retrieved successfully');
            response.products.forEach(product => {
                console.log(`ID: ${product.id}, Name: ${product.name}, Price: ${product.price}, Quantity: ${product.quantity}`);
            });
        } else {
            console.log('No products have been added yet');
        }
        askForAnotherAction();
    });
}

//function to start chat session for StockControl
function startChat() {
    //initialize the chat client for StockControl if not already done
    const chatClient = new smartretail.ChatService(
        '127.0.0.1:50051',
        grpc.credentials.createInsecure()
    );

    //ceate a new chat stream for this session
    const chatStream = chatClient.Chat();

    //handle incoming messages
    chatStream.on('data', function(chatMessage) {
        console.log(`${chatMessage.user}: ${chatMessage.message}`);
    });

    //handle chat session end
    chatStream.on('end', function() {
        console.log('Server ended the chat.');

        //ask if the user wants to start another chat
        const anotherChat = readlineSync.keyInYN('Do you want to start another chat? ');
        if (anotherChat) {
            //continue chatting
            startChat();
        } else {
            //ask if the user wants to perform another action
            const anotherAction = readlineSync.keyInYN('Do you want to perform another action? ');
            if (anotherAction) {
                //return to the main menu
                main();
            } else {
                console.log('Exit application');
                process.exit(0);
            }
        }
    });

    //function to get user input and send messages
    function getUserInput() {
        const message = readlineSync.question('Enter your message or type "exit" to end the chat: ');
        if (message.toLowerCase() === 'exit') {
            chatStream.end();
            //exit the function after ending the chat
            return;
        } else {
            chatStream.write({
                user: 'StockControlClient',
                message: message
            });
            getUserInput();
        }
    }

    //start the chat by getting the user's first input
    getUserInput();
}

//function to ask if the user wants to perform another action
function askForAnotherAction() {
    const anotherAction = readlineSync.keyInYN('Do you want to perform another action? ');
    if (anotherAction) {
        //return to the main menu
        main();
    } else {
        console.log('Exit application');
        process.exit(0);
    }
}
//entry point where execution of code begins 
main();