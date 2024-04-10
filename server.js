//imports the @grpc/grpc-js package, which provides the functionality for working with gRPC
const grpc = require('@grpc/grpc-js');
//imports the @grpc/proto-loader package, which is used to load Protocol Buffer in gRPC apps
const protoLoader = require('@grpc/proto-loader');
//import the file system module
const fs = require('fs'); 
//import the path module
const path = require('path'); 
//loads the Protocol Buffer definition file named StockControl.proto
const packageDefinition = protoLoader.loadSync('StockControl.proto', {});
//loads the Protocol Buffer definition file named Checkout.proto
const checkoutPackageDefinition = protoLoader.loadSync('Checkout.proto', {});
//loads the gRPC package definition from the packageDefinition
const smartretail = grpc.loadPackageDefinition(packageDefinition).smartretail;
const checkoutPackage = grpc.loadPackageDefinition(checkoutPackageDefinition).smartretail;//added

//implemtaion for adding products
//function that takes parameters call and callback represents logic for adding products
const addProduct = (call, callback) => {
  //logs product information received via call.request
  console.log('Adding product:', call.request);
  callback(null, { id: call.request.id, message: 'Product added successfully' });

  //prepare the product data string to write to the file
  const productData = `Product Added - ID: ${call.request.id}, Name: ${call.request.name}, Price: ${call.request.price}, Quantity: ${call.request.quantity}\n`;
  //filepath to create the file
  const filePath = path.join('C:/Users/cj13y/Documents/hdip_2023_ncirl/distrubited_systems/x14115034_Cullen_Janni', 'products.txt');
  fs.appendFile(filePath, productData, (err) => {
    if (err) {
      console.error('Error writing product to file:', err);
    } else {
      console.log('Product data added to file successfully');
    }
  });
};

//creates a new gRPC server instance
const server = new grpc.Server();

//adds services to the gRPC server
server.addService(smartretail.StockControl.service, {
  AddProduct: addProduct
});


//function for calculating total cost of products in shopping cart
const calculateTotal = (call, callback) => {
  const products = call.request.items;

  if (!products || products.length === 0) {
    const error = new Error('No products found in the cart');
    callback(error, null);
    return;
  }

  let total = 0;
  products.forEach(product => {
    total += product.price * product.quantity;
  });

  callback(null, { total });
};


//implementaion for verifycard 
function verifycard(call, callback){
  const { cardNumber, expiryDate, cvv } = call.request;
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
  callback(null, { isValid: true, message: "Card is valid" });
}


//checkout service to the gRPC server
server.addService(checkoutPackage.Checkout.service, {
  CalculateTotal: calculateTotal,
  VerifyCard: verifycard,
});

//port number server will listen to
const port = '50051';
//binds server to port
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (error, port) => {
  //returns error 
  if (error) {
    console.error('Server error:', error);
    return;
  }
  //connected successfully to port
  console.log(`Server running at http://0.0.0.0:${port}`);
});


