//load necessary modules
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const readlineSync = require('readline-sync');

//load the protocol buffer definition file
const customerServicePackageDefinition = protoLoader.loadSync('CustomerService.proto');
const smartretail = grpc.loadPackageDefinition(customerServicePackageDefinition).smartretail;

//create gRPC client instance for CustomerService
const customerServiceClient = new smartretail.CustomerService('127.0.0.1:50051', grpc.credentials.createInsecure());

//function to start a bidirectional chat session
function startChatSession() {
    //start the chat session
    console.log("Starting chat session...");
    const chatStream = customerServiceClient.Chat();

    chatStream.on('data', function(message) {
        console.log(`[${message.user}]: ${message.message}`);
    });
    //ends
    chatStream.on('end', function() {
        console.log('Chat session has ended.');
    });

    console.log("Welcome to customer service. This is how we can help you.");
    while (true) {
        //prompt the user for inputs
        const message = readlineSync.question('Enter your message or type "exit" to end the chat: ');
        if (message.toLowerCase() === 'exit') {
            chatStream.end();
            break;
        }
        chatStream.write({ user: 'Customer', message: message });
    }
}

//function to ask user questions and interact with the server
function askQuestion() {
    console.log("1: Ask about delivery cost");
    console.log("2: Ask about opening times");
    const option = readlineSync.question("Enter your choice 1 or 2: ");

    switch (option) {
        case '1':
            //send a request to ask about delivery cost
            customerServiceClient.AskQuestion({ questionType: 1 }, (error, response) => {
                if (error) {
                    console.error('Error asking about delivery cost:', error.message);
                } else {
                    console.log("Delivery cost:", response.message);
                }
                promptForAnotherQuestion();
            });
            break;
        case '2':
            //send a request to ask about opening times
            customerServiceClient.AskQuestion({ questionType: 2 }, (error, response) => {
                if (error) {
                    console.error('Error asking about opening times:', error.message);
                } else {
                    console.log("Opening times:", response.message);
                }
                promptForAnotherQuestion();
            });
            break;
        default:
            console.log("Invalid option");
            askQuestion();
            break;
    }
}

//function to prompt for another question
function promptForAnotherQuestion() {
    const anotherQuestion = readlineSync.keyInYN('Can we help you with anything else? ');
    if (anotherQuestion) {
        askQuestion();
    } else {
        console.log('Thank you for contacting customer service. Goodbye!');
        process.exit(0);
    }
}

//start the interaction by asking questions
askQuestion();

