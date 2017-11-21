// Required npm
var mysql = require("mysql");
var inquirer = require("inquirer");
require('console.table');

// Create a connection to bamazon db
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "root",
  database: "Bamazon"
});

// Connect to Bamazon db
connection.connect(function(err) {
  if(err) throw err;
  // Start program
  start();
});

    console.log("WelCome To The Managers VIEW");
    console.log("=============================");

// Function to start program flow
function start() {
  // Display options and get manager's choice of action
  getManagerAction();
}

// Function to get manager's choice of action and route to appropriate functions
function getManagerAction() {
  // Get command from user
  inquirer.prompt([
    { 
      type: "list",
      name: "choice",
      message: "What would you like to do?",
      choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product", "Exit"] 
    }
  ]).then(function(manager) {
    // Based on user choice, call appropriate function
    switch(manager.choice) {
      case "View Products for Sale":
        displayProducts();
        break;

      case "View Low Inventory":
        displayLowInventory();
        break;

      case "Add to Inventory":
        addToInventory();
        break;

      case "Add New Product":
        addNewProduct();
        break;

      case "Exit":
        process.exit();
        break;

      default: 
        break;
    }
  });
}

// Function to display products for sale
function displayProducts() {
  // Select query to display all items within table in database
  connection.query("SELECT item_id, product_name, price, stock_quantity FROM products", function(err, data) {
    if(err) {
      console.log(err);
    }else {
      console.log("");
      // Log data in tabular format
      console.table(data);
      // Display menu
      getManagerAction();
    }
  });
}

// Function to display products with stock_quantity <100
function displayLowInventory() {
  // Select from table in database to display item list of products with stock quantity <100
  connection.query("SELECT item_id, product_name, price, stock_quantity FROM products WHERE stock_quantity < 100", function(err, data) {
    if(err) {
      console.log(err);
    }else {
      // Log data received in tabular format
      console.table(data);
    }
    // Display menu
    getManagerAction();
  });
}

// Function to add to inventory
function addToInventory() {
  // Get ID and quantity to add of item to be updated
  inquirer.prompt([
    {
      name: "id",
      message: "ID of item to add:",
      // Validate if entered input is a number and write appropriate error message
      validate: function(input) {
        if (isNaN(input) || input === "" || input.includes(";")) {
          return 'Enter the ID number of the item you would like to add';
        } else {
          return true;
        }
      }
    },
    {
      name: "quantity",
      message: "How many would you like to add?",
      // Validate if entered input is a number and write appropriate error message
      validate: function(input) {
        if (isNaN(input) || input === "" || input.includes(";")) {
          return 'Enter a number for quantity';
        } else {
          return true;
        }
      }
    }
  ]).then(function(input) {
    // Getting stock_quantity to be added to
    connection.query("SELECT stock_quantity FROM products WHERE item_id = ?", [input.id], function(err, data) {
      if(err) {
        console.log(err);
      }else {
        // Current stock quantity retrieved from table
        var currentQuantity = parseFloat(data[0].stock_quantity);
        // Adding quantity specified to get new quantity to update in table
        var quantityToBeUpdated = currentQuantity + parseFloat(input.quantity);
        // Update query to update new quantity to table
        connection.query("UPDATE products SET stock_quantity = ? WHERE item_id = ?", [quantityToBeUpdated, input.id], function(err, data) {
          if(err) {
            console.log(err);
          }else {
            // Notifying user
            console.log("Stock quantity added to inventory");
          }
          // Display menu options again
          getManagerAction();
        });
      }
    });
  });
}

// Function to handle adding of new products
function addNewProduct() {
  // Getting a list of all the department names on Bamazon
  connection.query("SELECT department_name FROM departments", function(err, data) {
    var departmentNames = data.map(item => item.department_name);
    // Ask details of product to be added
    inquirer.prompt([
      {
        name: "name",
        message: "Enter the name of the product:",
        // Validate if entered input is in proper price format
        validate: function(input) {
          if (input !== "" && !input.includes(";")) {
            return true;
          } else if(input === "") {
            // Checking if product name is empty and displaying message to avoid that
            return "Required: Product name cannot be empty";
          }else {
            return "Invalid product name";
          }
        }
      },
      {
        type: "list",
        name: "department",
        message: "Choose the appropriate department it belongs to:",
        choices: departmentNames
      },
      {
        name: "price",
        message: "Enter it's selling price (example: 10.79, 0.50, 250):",
        // Validate if entered input is in proper price format
        validate: function(input) {
          // Using regex pattern for matching price
          var check = input.match(/^-?\d*(\.\d{2})?$/);
          if (check && input!== ""  && !input.includes(";")) {
            return true;
          } else {
            return 'Incorrect price format - See examples above';
          }
        }
      },
      {
        name: "quantity",
        message: "Enter how much of it to stock in inventory:",
        // Validate if entered input is a number 
        validate: function(input) {
          if (isNaN(input) || input === ""  || input.includes(";")) {
            return 'Enter a number for quantity';
          } else {
            return true;
          }
        }
      }
    ]).then(function(product) {
      // Inserting data collected from user to products table
      connection.query("INSERT INTO products SET ?", {
        product_name: product.name,
        department_name: product.department,
        price: product.price,
        stock_quantity: product.quantity
      }, function(err, data) {
        if(err) {
          console.log(err);
        }else {
          // Notify user
          console.log(`
-------------------------
New product - '${product.name}' - added to Bamazon!
-------------------------
`);
        }
        // Display menu again
        getManagerAction();
      });
    });
  });
}