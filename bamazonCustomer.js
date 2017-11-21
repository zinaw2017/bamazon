// Require dependencies
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
    if (err) throw err;
    // Start program
    start();
});

// Start function to display welcome message and begin
function start() {
    console.log('Welcome to Bamazon online Where shoping is a pleasure!!');
    console.log('=======================================================');
    // Display products listed in db
    displayProducts();
}

// Function to display products listed in table
function displayProducts() {
    connection.query("SELECT item_id, product_name, price FROM products", function(err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("");
            // Log data in tabular format
            console.table(data);
            getUserChoice();
        }
    })
}

// Function to let user choose item and quantity to buy
function getUserChoice() {
    inquirer.prompt([{
            name: "id",
            message: "Enter the ID of the product you want to purchase:",
            // Validate if entered input is a number and write appropriate error message
            validate: function(input) {
                if (isNaN(input) || input === "" || input.includes(";")) {
                    return 'Enter the ID (a number) of the product';
                } else {
                    return true;
                }
            }
        },
        {
            name: "quantity",
            message: "Enter the quantity you want to purchase:",
            // Validate if entered input is a number and write appropriate error message
            validate: function(input) {
                if (isNaN(input) || input === "" || input.includes(";")) {
                    return 'Enter a number for quantity';
                } else {
                    return true;
                }
            }
        }
    ]).then(function(choice) {
        // If (select quantity from products where id = choice.id) quantity in db > choice.quantity => update in db (update products set quantity = dbquantity - userquantity where id = user.id)
        connection.query("SELECT stock_quantity, price, product_sales, department_name FROM products WHERE item_id = ?", [choice.id], function(err, data) {
            if (err) {
                console.log(err);
            } else {
                // Quantity of product in stock
                var stock_quantity = data[0].stock_quantity;
                // Checking if requested amount is in stock
                if (stock_quantity > choice.quantity) {
                    var updatedQuantity = stock_quantity - choice.quantity;

                    // Calculating order total from price of item and quantity requested
                    var priceOfItem = data[0].price;
                    var totalCost = priceOfItem * choice.quantity;

                    // Storing department_name for use in updating departments
                    var department_name = data[0].department_name;

                    // Check if product_sales is null, then set to 0.00 else use product_sales from products
                    if (data[0].product_sales !== null) {
                        var product_sales = data[0].product_sales;
                    } else {
                        var product_sales = 0.00;
                    }
                    // Calculating new product_sales using totalCost
                    product_sales += totalCost;

                    // Updating stock_quantity after purchase to db
                    connection.query("UPDATE products SET stock_quantity = ?, product_sales = ? WHERE item_id = ?", [updatedQuantity, product_sales, choice.id], function(err, data) {
                        var orderID = Math.random().toString(36).slice(2);

                        //transaction disply
                        console.log(`
                          Order placed successfully.
                          Your order ID is: ${orderID}`);
                        console.log(
                        `Order total: $${totalCost.toFixed(2)}

                           `);
                        // Updating new department_sales to departments
                        connection.query("SELECT total_sales FROM departments WHERE department_name = ?", [department_name], function(err, data) {
                            if (err) {
                                console.log(err);
                            } else {
                                var department_sales = data[0].total_sales;
                                // Calculate new total_sales using totalCost of user's purchase
                                department_sales += totalCost;
                                // Update new total_sales into departments
                                connection.query("UPDATE departments SET total_sales = ? WHERE department_name = ?", [department_sales, department_name], function(err, data) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    // Ask if user wants to continue shopping
                                    furtherAction();
                                });
                            }
                        });
                    });

                } else {
                    console.log(`
                  Insufficient quantity! 
                    Order cannot go through.please visit Us again.
					  `);
                    // Ask if user wants to continue shopping
                    furtherAction();
                }
            }
        });
    })
}

// Function to get further action from user
function furtherAction() {
    inquirer.prompt([{
        type: "list",
        name: "next",
        message: "Would you like to:",
        choices: ["Continue shopping", "Exit"]
    }]).then(function(action) {
        switch (action.next) {
            case "Continue shopping":
                displayProducts();
                break;

            case "Exit":
                console.log(`
                 Thank you for shopping at Bamazon! where shoping is a pleasure!
 
                       `)
                process.exit();
                break;

            default:
                break;
        }
    })
}