// Get DOM elements
const recipeForm = document.getElementById('recipe-form');
const addIngredientBtn = document.getElementById('add-ingredient-btn');
const ingredientsList = document.getElementById('ingredients-list');
const savedRecipesList = document.getElementById('saved-recipes-list');
const mealSelectors = document.querySelectorAll('.meal-selector');
const generateListBtn = document.getElementById('generate-list-btn');
const groceryListControls = document.getElementById('grocery-list-controls');
const finalizeListBtn = document.getElementById('finalize-list-btn');
const groceryListElem = document.getElementById('grocery-list');
const shoppingListElem = document.getElementById('shopping-list');
const recipeDetails = document.getElementById('recipe-details');
const recipeDetailsName = document.getElementById('recipe-details-name');
const recipeDetailsIngredientsEdit = document.getElementById('recipe-details-ingredients-edit');
const addDetailIngredientBtn = document.getElementById('add-detail-ingredient-btn');
const saveIngredientsBtn = document.getElementById('save-ingredients-btn');
const recipeDetailsStepsTextarea = document.getElementById('recipe-details-steps');
const closeDetailsBtn = document.getElementById('close-details-btn');
const recipeImageInput = document.getElementById('recipe-image');
const recipeDetailsImage = document.getElementById('recipe-details-image');
const updateRecipeImageInput = document.getElementById('update-recipe-image');
const saveRecipeImageBtn = document.getElementById('save-recipe-image-btn');
const savePrepStepsBtn = document.getElementById('save-prep-steps-btn');
const editMessage = document.getElementById('edit-message');
const generateCookbookBtn = document.getElementById('generate-cookbook-btn');
const recipeCategorySelect = document.getElementById('recipe-category');
const recipeDetailsCategorySelect = document.getElementById('recipe-details-category');
const saveCategoryBtn = document.getElementById('save-category-btn');
const viewCategorySelect = document.getElementById('view-category-select');
const deleteRecipeImageBtn = document.getElementById('delete-recipe-image-btn');
const exportDayBtns = document.querySelectorAll('.export-day-btn');

// Variable to store the name of the currently viewed recipe
let currentRecipeName = null;

// Initialize data from localStorage or as empty arrays/objects
let recipes;
try {
    recipes = JSON.parse(localStorage.getItem('recipes')) || [];
} catch (e) {
    console.error("Failed to parse recipes from localStorage. Starting with a fresh list.");
    recipes = [];
}
let mealPlan = JSON.parse(localStorage.getItem('mealPlan')) || {};

// --- Recipe Management Functions ---

// Adds a new ingredient input field to the form
addIngredientBtn.addEventListener('click', () => {
    const ingredientInputDiv = document.createElement('div');
    ingredientInputDiv.className = 'ingredient-input';
    ingredientInputDiv.innerHTML = `
        <input type="text" class="ingredient-name" placeholder="Name">
        <input type="text" class="ingredient-quantity" placeholder="Quantity">
        <input type="text" class="ingredient-unit" placeholder="Unit">
    `;
    ingredientsList.appendChild(ingredientInputDiv);
});

// Handles saving a new recipe
recipeForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const recipeName = document.getElementById('recipe-name').value;
    const recipeCategory = recipeCategorySelect.value;
    const prepSteps = document.getElementById('prep-steps').value;

    const ingredientInputs = ingredientsList.querySelectorAll('.ingredient-input');
    const ingredients = [];
    ingredientInputs.forEach(inputDiv => {
        const name = inputDiv.querySelector('.ingredient-name').value;
        const quantity = inputDiv.querySelector('.ingredient-quantity').value;
        const unit = inputDiv.querySelector('.ingredient-unit').value;
        if (name) {
            ingredients.push({ name, quantity, unit });
        }
    });

    const file = recipeImageInput.files[0];
    const newRecipe = {
        name: recipeName,
        category: recipeCategory,
        ingredients: ingredients,
        steps: prepSteps,
        image: null
    };

    const saveRecipe = () => {
        recipes.push(newRecipe);
        localStorage.setItem('recipes', JSON.stringify(recipes));
        renderRecipes();
        recipeForm.reset();
        // Explicitly reset the file input value
        recipeImageInput.value = '';
    };

    if (file) {
        // Limit file size to roughly 4MB (4 * 1024 * 1024 bytes) to avoid localStorage limits
        const fileSizeLimit = 4 * 1024 * 1024;
        if (file.size > fileSizeLimit) {
            alert("Error: The image file is too large. Please select a smaller image (under 4MB).");
            recipeImageInput.value = ''; // Clear the file input
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            newRecipe.image = reader.result;
            saveRecipe();
        };
        reader.readAsDataURL(file);
    } else {
        saveRecipe();
    }
});

// Displays saved recipes based on selected category and updates the dropdown menus
function renderRecipes() {
    savedRecipesList.innerHTML = ''; // Clear the list
    mealSelectors.forEach(selector => {
        selector.innerHTML = '<option value="">Select a recipe...</option>';
    });
    
    const selectedCategory = viewCategorySelect.value;
    const recipesToDisplay = selectedCategory === 'All' ? recipes : recipes.filter(r => r.category === selectedCategory);

    recipesToDisplay.forEach(recipe => {
        // Add to the saved recipes list and make it clickable
        const li = document.createElement('li');
        
        // Create a checkbox and a label for the list item
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'cookbook-select-checkbox';
        checkbox.dataset.recipeName = recipe.name;

        const label = document.createElement('span');
        label.textContent = recipe.name;
        label.className = 'recipe-item-label';

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-recipe-btn');
        deleteBtn.dataset.recipeName = recipe.name;

        li.appendChild(checkbox);
        li.appendChild(label);
        li.appendChild(deleteBtn);
        
        li.classList.add('recipe-item'); // Add a class to style and identify it
        savedRecipesList.appendChild(li);

        // Add to each meal selector dropdown
        const option = document.createElement('option');
        option.value = recipe.name;
        option.textContent = recipe.name;
        mealSelectors.forEach(selector => {
            const newOption = option.cloneNode(true);
            selector.appendChild(newOption);
        });
    });

    // Re-select previously saved recipes in the meal plan
    mealSelectors.forEach(selector => {
        const day = selector.closest('.day').dataset.day;
        if (mealPlan[day]) {
            selector.value = mealPlan[day];
        }
    });
}

// Event listener for the new category dropdown to filter recipes
viewCategorySelect.addEventListener('change', renderRecipes);

// Event listener for deleting a recipe
savedRecipesList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-recipe-btn')) {
        const recipeNameToDelete = e.target.dataset.recipeName;
        
        // Filter out the recipe to be deleted
        recipes = recipes.filter(r => r.name !== recipeNameToDelete);
        localStorage.setItem('recipes', JSON.stringify(recipes));
        
        // Also remove the recipe from the meal plan if it was selected
        for (const day in mealPlan) {
            if (mealPlan[day] === recipeNameToDelete) {
                mealPlan[day] = '';
            }
        }
        localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
        
        renderRecipes(); // Re-render the list
    }
});

// Add event listener to the saved recipes list to show details on click
savedRecipesList.addEventListener('click', (e) => {
    // Check if the clicked item is the text label (not the checkbox or button)
    if (e.target.classList.contains('recipe-item-label')) {
        const recipeName = e.target.textContent;
        const selectedRecipe = recipes.find(r => r.name === recipeName);

        if (selectedRecipe) {
            // Store the current recipe name
            currentRecipeName = selectedRecipe.name;
            // Clear any previous edit messages
            editMessage.style.display = 'none';

            // Populate the details section
            recipeDetailsName.textContent = selectedRecipe.name;
            recipeDetailsStepsTextarea.value = selectedRecipe.steps;
            recipeDetailsCategorySelect.value = selectedRecipe.category;

            if (selectedRecipe.image) {
                recipeDetailsImage.src = selectedRecipe.image;
                recipeDetailsImage.style.display = 'block';
                deleteRecipeImageBtn.style.display = 'block';
            } else {
                recipeDetailsImage.style.display = 'none';
                deleteRecipeImageBtn.style.display = 'none';
            }

            // Render editable ingredient inputs
            renderEditableIngredients(selectedRecipe.ingredients);

            // Show the details section and hide other sections
            recipeDetails.style.display = 'block';
            document.getElementById('recipe-manager').style.display = 'none';
            document.getElementById('meal-planner').style.display = 'none';
            document.getElementById('grocery-list-section').style.display = 'none';
        }
    }
});

// Event listener for deleting a picture
deleteRecipeImageBtn.addEventListener('click', () => {
    if (currentRecipeName) {
        recipes = recipes.map(recipe => {
            if (recipe.name === currentRecipeName) {
                return { ...recipe, image: null };
            }
            return recipe;
        });
        localStorage.setItem('recipes', JSON.stringify(recipes));
        recipeDetailsImage.style.display = 'none';
        deleteRecipeImageBtn.style.display = 'none';
        editMessage.textContent = 'Picture deleted successfully!';
        editMessage.style.display = 'block';
    }
});

// Function to render editable ingredients
function renderEditableIngredients(ingredients) {
    recipeDetailsIngredientsEdit.innerHTML = '';
    ingredients.forEach(ingredient => {
        const ingredientInputDiv = document.createElement('div');
        ingredientInputDiv.className = 'ingredient-input-details';
        ingredientInputDiv.innerHTML = `
            <input type="text" class="ingredient-name" value="${ingredient.name}" placeholder="Name">
            <input type="text" class="ingredient-quantity" value="${ingredient.quantity}" placeholder="Quantity">
            <input type="text" class="ingredient-unit" value="${ingredient.unit}" placeholder="Unit">
            <button class="remove-ingredient-btn">Remove</button>
        `;
        recipeDetailsIngredientsEdit.appendChild(ingredientInputDiv);
    });
}

// Add event listener for adding new ingredient to details view
addDetailIngredientBtn.addEventListener('click', () => {
    const ingredientInputDiv = document.createElement('div');
    ingredientInputDiv.className = 'ingredient-input-details';
    ingredientInputDiv.innerHTML = `
        <input type="text" class="ingredient-name" placeholder="Name">
        <input type="text" class="ingredient-quantity" placeholder="Quantity">
        <input type="text" class="ingredient-unit" placeholder="Unit">
        <button class="remove-ingredient-btn">Remove</button>
    `;
    recipeDetailsIngredientsEdit.appendChild(ingredientInputDiv);
});

// Add event listener for removing ingredients from details view
recipeDetailsIngredientsEdit.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-ingredient-btn')) {
        e.target.closest('.ingredient-input-details').remove();
    }
});

// Add event listener for saving the updated recipe ingredients
saveIngredientsBtn.addEventListener('click', () => {
    if (currentRecipeName) {
        const ingredientInputs = recipeDetailsIngredientsEdit.querySelectorAll('.ingredient-input-details');
        const updatedIngredients = [];
        ingredientInputs.forEach(inputDiv => {
            const name = inputDiv.querySelector('.ingredient-name').value;
            const quantity = inputDiv.querySelector('.ingredient-quantity').value;
            const unit = inputDiv.querySelector('.ingredient-unit').value;
            if (name) {
                updatedIngredients.push({ name, quantity, unit });
            }
        });
        
        recipes = recipes.map(recipe => {
            if (recipe.name === currentRecipeName) {
                return { ...recipe, ingredients: updatedIngredients };
            }
            return recipe;
        });
        localStorage.setItem('recipes', JSON.stringify(recipes));
        editMessage.textContent = 'Ingredients saved successfully!';
        editMessage.style.display = 'block';
    }
});

// Add event listener for the "Close" button
closeDetailsBtn.addEventListener('click', () => {
    // Reset current recipe name
    currentRecipeName = null;
    // Hide the details section and show the others
    recipeDetails.style.display = 'none';
    document.getElementById('recipe-manager').style.display = 'block';
    document.getElementById('meal-planner').style.display = 'block';
    document.getElementById('grocery-list-section').style.display = 'block';
});

// Add event listener for saving the updated recipe image
saveRecipeImageBtn.addEventListener('click', () => {
    if (currentRecipeName) {
        const file = updateRecipeImageInput.files[0];
        if (!file) {
            editMessage.textContent = 'Please select a picture to save.';
            editMessage.style.display = 'block';
            return;
        }

        const fileSizeLimit = 4 * 1024 * 1024;
        if (file.size > fileSizeLimit) {
            editMessage.textContent = `Error: The image file is too large. Please select a smaller image (under 4MB).`;
            editMessage.style.display = 'block';
            updateRecipeImageInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const imageData = reader.result;
            recipes = recipes.map(recipe => {
                if (recipe.name === currentRecipeName) {
                    return { ...recipe, image: imageData };
                }
                return recipe;
            });
            localStorage.setItem('recipes', JSON.stringify(recipes));
            recipeDetailsImage.src = imageData;
            recipeDetailsImage.style.display = 'block';
            deleteRecipeImageBtn.style.display = 'block';
            updateRecipeImageInput.value = '';
            editMessage.textContent = 'Picture saved successfully!';
            editMessage.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Add event listener for saving the updated prep steps
savePrepStepsBtn.addEventListener('click', () => {
    if (currentRecipeName) {
        const updatedSteps = recipeDetailsStepsTextarea.value;
        recipes = recipes.map(recipe => {
            if (recipe.name === currentRecipeName) {
                return { ...recipe, steps: updatedSteps };
            }
            return recipe;
        });
        localStorage.setItem('recipes', JSON.stringify(recipes));
        // Show success message
        editMessage.textContent = 'Preparation steps saved successfully!';
        editMessage.style.display = 'block';
    }
});

// Add event listener for saving the updated category
saveCategoryBtn.addEventListener('click', () => {
    if (currentRecipeName) {
        const updatedCategory = recipeDetailsCategorySelect.value;
        recipes = recipes.map(recipe => {
            if (recipe.name === currentRecipeName) {
                return { ...recipe, category: updatedCategory };
            }
            return recipe;
        });
        localStorage.setItem('recipes', JSON.stringify(recipes));
        renderRecipes(); // Re-render the list
        editMessage.textContent = 'Category saved successfully!';
        editMessage.style.display = 'block';
    }
});

// --- Meal Planner Functions ---

// Handles changes to the meal selector dropdowns
mealSelectors.forEach(selector => {
    selector.addEventListener('change', (e) => {
        const day = e.target.closest('.day').dataset.day;
        mealPlan[day] = e.target.value;
        localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
        
        // Show or hide export button based on selection
        const exportBtn = e.target.closest('.day').querySelector('.export-day-btn');
        if (e.target.value) {
            exportBtn.style.display = 'block';
        } else {
            exportBtn.style.display = 'none';
        }
    });
});

// Event delegation for export day buttons
document.getElementById('meal-planner').addEventListener('click', (e) => {
    if (e.target.classList.contains('export-day-btn')) {
        const dayContainer = e.target.closest('.day');
        const day = dayContainer.dataset.day;
        const recipeName = mealPlan[day];

        if (!recipeName) {
            alert("No recipe selected for this day.");
            return;
        }

        const recipe = recipes.find(r => r.name === recipeName);
        if (recipe) {
            const now = new Date();
            const eventDate = new Date(now);
            const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayIndex = daysOfWeek.indexOf(day);
            eventDate.setDate(now.getDate() + (dayIndex - now.getDay()));
            
            const mealCategory = recipe.category.toLowerCase();
            let startHour = 18;
            let duration = 60;

            if (mealCategory === 'breakfast') {
                startHour = 8;
            } else if (mealCategory === 'lunch') {
                startHour = 12;
            }

            const eventStart = new Date(eventDate);
            eventStart.setHours(startHour, 0, 0);
            
            const eventEnd = new Date(eventStart);
            eventEnd.setMinutes(eventStart.getMinutes() + duration);
            
            const format = (date) => date.toISOString().replace(/[-:]|\.\d{3}/g, '');
            
            const ingredientsList = recipe.ingredients.map(ing => `- ${ing.quantity} ${ing.unit} ${ing.name}`).join('\n');
            const description = `Ingredients:\n${ingredientsList}\n\nPreparation Steps:\n${recipe.steps}`;
            
            const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE` +
                `&text=${encodeURIComponent(recipe.name)}` +
                `&dates=${format(eventStart)}/${format(eventEnd)}` +
                `&details=${encodeURIComponent(description)}`;

            window.open(calendarUrl, '_blank');
        }
    }
});

// --- Grocery List Functions ---

// Handles generating the grocery list
generateListBtn.addEventListener('click', () => {
    const consolidatedList = {};

    for (const day in mealPlan) {
        const recipeName = mealPlan[day];
        if (recipeName) {
            const recipe = recipes.find(r => r.name === recipeName);
            if (recipe) {
                recipe.ingredients.forEach(ingredient => {
                    const key = ingredient.name.toLowerCase();
                    if (!consolidatedList[key]) {
                        consolidatedList[key] = {
                            name: ingredient.name,
                            quantity: 0,
                            unit: ingredient.unit
                        };
                    }
                    // Handle quantity aggregation
                    const currentQuantity = parseFloat(consolidatedList[key].quantity);
                    const newQuantity = parseFloat(ingredient.quantity);
                    if (!isNaN(currentQuantity) && !isNaN(newQuantity)) {
                        consolidatedList[key].quantity = currentQuantity + newQuantity;
                    } else if (ingredient.quantity) {
                        // If quantity is not a number, just add it to the list
                        consolidatedList[key].quantity = consolidatedList[key].quantity ? 
                                `${consolidatedList[key].quantity}, ${ingredient.quantity}` : 
                                ingredient.quantity;
                    }
                });
            }
        }
    }

    renderGroceryList(consolidatedList);
});

// Displays the initial grocery list with checkboxes
function renderGroceryList(list) {
    groceryListElem.innerHTML = '';
    shoppingListElem.innerHTML = ''; // Clear the previous shopping list

    // Show the controls
    groceryListControls.style.display = 'block';

    for (const key in list) {
        const item = list[key];
        const li = document.createElement('li');
        const quantityText = item.quantity ? `${item.quantity} ${item.unit}`.trim() : '';
        
        li.innerHTML = `
            <label>
                <input type="checkbox" class="grocery-item-checkbox" data-item-name="${item.name}">
                ${quantityText} ${item.name}
            </label>
        `;
        groceryListElem.appendChild(li);
    }
}

// Handles generating the final shopping list
finalizeListBtn.addEventListener('click', () => {
    const checkboxes = groceryListElem.querySelectorAll('.grocery-item-checkbox');
    const shoppingList = [];

    checkboxes.forEach(checkbox => {
        // Collect the items that ARE checked
        if (checkbox.checked) {
            const listItem = checkbox.closest('li');
            shoppingList.push(listItem.textContent.trim());
        }
    });

    renderShoppingList(shoppingList);
});

// Displays the final filtered shopping list
function renderShoppingList(list) {
    shoppingListElem.innerHTML = '';
    if (list.length === 0) {
        const li = document.createElement('li');
        li.textContent = "You have all the ingredients! Enjoy your cooking!";
        shoppingListElem.appendChild(li);
    } else {
        list.forEach(itemText => {
            const li = document.createElement('li');
            li.textContent = itemText;
            shoppingListElem.appendChild(li);
        });
    }
}

// --- Cookbook Generation Function ---
generateCookbookBtn.addEventListener('click', () => {
    const selectedCheckboxes = document.querySelectorAll('.cookbook-select-checkbox:checked');
    const selectedRecipeNames = Array.from(selectedCheckboxes).map(checkbox => checkbox.dataset.recipeName);

    const cookbookRecipes = recipes.filter(r => selectedRecipeNames.includes(r.name));

    if (cookbookRecipes.length > 0) {
        let cookbookHTML = `
            <html>
            <head>
                <title>My Printable Cookbook</title>
                <link rel="stylesheet" href="style.css">
            </head>
            <body>
                <header>
                    <h1>My Custom Cookbook</h1>
                </header>
                <main>
        `;
        
        cookbookRecipes.forEach(recipe => {
            const ingredientsList = recipe.ingredients.map(ing => `<li>${ing.quantity} ${ing.unit} ${ing.name}</li>`).join('');
            
            cookbookHTML += `
                <div class="cookbook-recipe">
                    <h3>${recipe.name}</h3>
                    ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.name} image">` : ''}
                    <h4>Ingredients</h4>
                    <ul>${ingredientsList}</ul>
                    <h4>Preparation Steps</h4>
                    <p>${recipe.steps}</p>
                </div>
            `;
        });
        
        cookbookHTML += `
                </main>
            </body>
            </html>
        `;

        const newWindow = window.open('', '_blank');
        newWindow.document.write(cookbookHTML);
        newWindow.document.close();
        newWindow.print();
    } else {
        alert("Please select at least one recipe to generate a cookbook.");
    }
});

// Initial render when the page loads
renderRecipes();