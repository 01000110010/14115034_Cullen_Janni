//imports the @grpc/grpc-js package, which provides the functionality for working with gRPC
const grpc = require('@grpc/grpc-js');
//imports the @grpc/proto-loader package, which is used to load Protocol Buffer in gRPC apps
const protoLoader = require('@grpc/proto-loader');
//loads the Protocol Buffer definition file named StockControl.proto
const packageDefinition = protoLoader.loadSync('StockControl.proto', {});
//loads the Protocol Buffer definition file named Checkout.proto
const checkoutPackageDefinition = protoLoader.loadSync('Checkout.proto', {});
//loads the gRPC package definition from the packageDefinition
const smartretail = grpc.loadPackageDefinition(packageDefinition).smartretail;
const checkoutPackage = grpc.loadPackageDefinition(checkoutPackageDefinition).smartretail;//added



//function that takes parameters call and callback represents logic for adding products
const addProduct = (call, callback) => {
  //logs product information received via call.request
  console.log('Adding product:', call.request);
  callback(null, { id: call.request.id, message: 'Product added successfully' });
};

//function that takes parameters call and callback represents logic for deleting products
const deleteProduct = (call, callback) => {
  console.log('Deleting product:', call.request);
  callback(null, { id: call.request.id, message: 'Product deleted successfully' });
};

//function that takes parameters call and callback represents logic for updating products
const updateProduct = (call, callback) => {
  console.log('Updating product:', call.request);
  callback(null, { id: call.request.id, message: 'Product updated successfully' });
};

//creates a new gRPC server instance
const server = new grpc.Server();

//adds services to the gRPC server
server.addService(smartretail.StockControl.service, {
  AddProduct: addProduct,
  DeleteProduct: deleteProduct,
  UpdateProduct: updateProduct

});

//function for calculating total cost of products in shopping cart
const calculateTotal = (call, callback) => {
  const products = call.request.products;
  let total = 0;
  products.forEach(products => {
    total += products.price * products.quantity;
  });
  callback(null, { total });
};

//checkout service to the gRPC server
server.addService(checkoutPackage.Checkout.service, {
  CalculateTotal: calculateTotal,
  
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


