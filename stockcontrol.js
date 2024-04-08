//load required modules 
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const readlineSync = require('readline-sync');
//loads the Protocol Buffer definition file named StockControl.proto
const packageDefinition = protoLoader.loadSync('StockControl.proto', {});
//loads the gRPC package definition from the packageDefinition
const smartretail = grpc.loadPackageDefinition(packageDefinition) .smartretail;

//creates new gRPC client for StockControl service and specifies the address and port of the gRPC server
const stockControlClient = new smartretail.StockControl(
    '217.0.0.1:50051',
    grpc.credentials.createInsecure(),
);

//create function to add product and prompts user to enter product details
function addProduct(){
    const id =readlineSunc.question('Enter product ID:');
    const name = readlineSync.question('Enter product name:');
    const price = readlineSync.questionDouble('Enter product price');
    const quantity = readlineSync.questionInt('Enter product quantity');

    const product = {id, name, price, quantity};

    //call the ADDProduct RPC which gives error or success message to client
    stockControlClient.AddProduct(product, (error, response) => {
        if (error) {
            console.error('Error adding product', error.message);
            return;
        }
        console.log('Product was added successfully', response.message);
    });
}

  