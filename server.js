const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync('StockControl.proto', {});
const smartretail = grpc.loadPackageDefinition(packageDefinition).smartretail;


const addProduct = (call, callback) => {
  console.log('Adding product:', call.request);
  callback(null, { id: call.request.id, message: 'Product added successfully' });
};

const deleteProduct = (call, callback) => {
  console.log('Deleting product:', call.request);
  callback(null, { id: call.request.id, message: 'Product deleted successfully' });
};

const updateProduct = (call, callback) => {
  console.log('Updating product:', call.request);
  callback(null, { id: call.request.id, message: 'Product updated successfully' });
};


const server = new grpc.Server();


server.addService(smartretail.StockControl.service, {
  AddProduct: addProduct,
  DeleteProduct: deleteProduct,
  UpdateProduct: updateProduct
});


const port = '3000';
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (error, port) => {
  if (error) {
    console.error('Server error:', error);
    return;
  }
  console.log(`Server running at http://0.0.0.0:${port}`);
});
