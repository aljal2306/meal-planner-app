// --- Supabase Setup ---
const SUPABASE_URL = 'https://subswvcwemwwfolsepuj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1YnN3dmN3ZW13d2ZvbHNlcHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTY0OTYsImV4cCI6MjA3MTIzMjQ5Nn0.MtpRVPgKs443rVzWuBXaFPChG4pIiey9FT0NAiHlbxs';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
const saveNameBtn = document.getElementById('save-name-btn'); // New button
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

// Initialize data from Supabase and localStorage
let recipes = [];
let mealPlan = JSON.parse(localStorage.getItem('mealPlan')) || {};

// --- Data Fetching and Saving Functions ---

async function fetchRecipes() {
    let { data, error } = await supabaseClient
        .from('recipes')
        .select('*');
    if (error) {
        console.error('Error fetching recipes:', error);
        return;
    }
    recipes = data;
    renderRecipes();
}

async function saveRecipeToDb(recipe) {
    const { error } = await supabaseClient
        .from('recipes')
        .insert([recipe]);
    if (error) {
        console.error('Error saving recipe:', error);
        alert('There was an error saving your recipe. Please try again.');
        return;
    }
    await fetchRecipes();
    recipeForm.reset();
    recipeImageInput.value = '';
}

async function updateRecipeInDb(oldName, updateObject) {
    const { error } = await supabaseClient
        .from('recipes')
        .update(updateObject)
        .eq('name', oldName);
    if (error) {
        console.error('Error updating recipe:', error);
        alert('There was an error updating your recipe. Please try again.');
        return;
    }
    await fetchRecipes();
}

async function deleteRecipeFromDb(recipeName) {
    const { error } = await supabaseClient
        .from('recipes')
        .delete()
        .eq('name', recipeName);
    if (error) {
        console.error('Error deleting recipe:', error);
        alert('There was an error deleting the recipe. Please try again.');
        return;
    }
    for (const day in mealPlan) {
        if (mealPlan[day] === recipeName) {
            mealPlan[day] = '';
        }
    }
    localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
    await fetchRecipes();
}

// --- Recipe Management Functions ---

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
        saveRecipeToDb(newRecipe);
    };

    if (file) {
        const fileSizeLimit = 4 * 1024 * 1024;
        if (file.size > fileSizeLimit) {
            alert("Error: The image file is too large. Please select a smaller image (under 4MB).");
            recipeImageInput.value = '';
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

function renderRecipes() {
    savedRecipesList.innerHTML = '';
    mealSelectors.forEach(selector => {
        selector.innerHTML = '<option value="">Select a recipe...</option>';
    });

    const selectedCategory = viewCategorySelect.value;
    const recipesToDisplay = selectedCategory === 'All' ? recipes : recipes.filter(r => r.category === selectedCategory);

    recipesToDisplay.forEach(recipe => {
        const li = document.createElement('li');
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
        li.classList.add('recipe-item');
        savedRecipesList.appendChild(li);

        const option = document.createElement('option');
        option.value = recipe.name;
        option.textContent = recipe.name;
        mealSelectors.forEach(selector => {
            const newOption = option.cloneNode(true);
            selector.appendChild(newOption);
        });
    });

    mealSelectors.forEach(selector => {
        const day = selector.closest('.day').dataset.day;
        if (mealPlan[day]) {
            selector.value = mealPlan[day];
        }
    });
}

viewCategorySelect.addEventListener('change', renderRecipes);

savedRecipesList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-recipe-btn')) {
        const recipeNameToDelete = e.target.dataset.recipeName;
        deleteRecipeFromDb(recipeNameToDelete);
        return;
    }

    if (e.target.classList.contains('recipe-item-label')) {
        const recipeName = e.target.textContent;
        const selectedRecipe = recipes.find(r => r.name === recipeName);

        if (selectedRecipe) {
            currentRecipeName = selectedRecipe.name;
            editMessage.style.display = 'none';

            recipeDetailsName.value = selectedRecipe.name;
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

            renderEditableIngredients(selectedRecipe.ingredients);
            
            document.getElementById('recipe-manager').style.display = 'none';
            document.getElementById('meal-planner').style.display = 'none';
            document.getElementById('grocery-list-section').style.display = 'none';
            document.getElementById('recipe-details').style.display = 'block';
        }
    }
});

saveNameBtn.addEventListener('click', async () => {
    if (currentRecipeName) {
        const newRecipeName = recipeDetailsName.value;
        if (newRecipeName === currentRecipeName) {
            editMessage.textContent = 'Name is unchanged.';
            editMessage.style.display = 'block';
            return;
        }

        const { error } = await supabaseClient
            .from('recipes')
            .update({ name: newRecipeName })
            .eq('name', currentRecipeName);
        
        if (error) {
            console.error('Error updating recipe name:', error);
            alert('There was an error updating the recipe name. Please try again.');
            return;
        }

        const oldName = currentRecipeName;
        currentRecipeName = newRecipeName;
        for (const day in mealPlan) {
            if (mealPlan[day] === oldName) {
                mealPlan[day] = newRecipeName;
            }
        }
        localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
        await fetchRecipes();

        editMessage.textContent = 'Name saved successfully!';
        editMessage.style.display = 'block';
    }
});

deleteRecipeImageBtn.addEventListener('click', () => {
    if (currentRecipeName) {
        updateRecipeInDb(currentRecipeName, { image: null });
        recipeDetailsImage.style.display = 'none';
        deleteRecipeImageBtn.style.display = 'none';
        editMessage.textContent = 'Picture deleted successfully!';
        editMessage.style.display = 'block';
    }
});

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

recipeDetailsIngredientsEdit.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-ingredient-btn')) {
        e.target.closest('.ingredient-input-details').remove();
    }
});

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
        updateRecipeInDb(currentRecipeName, { ingredients: updatedIngredients });
        editMessage.textContent = 'Ingredients saved successfully!';
        editMessage.style.display = 'block';
    }
});

closeDetailsBtn.addEventListener('click', () => {
    currentRecipeName = null;
    document.getElementById('recipe-details').style.display = 'none';
    document.getElementById('recipe-manager').style.display = 'block';
    document.getElementById('meal-planner').style.display = 'block';
    document.getElementById('grocery-list-section').style.display = 'block';
});

saveRecipeImageBtn.addEventListener('click', async () => {
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
            updateRecipeInDb(currentRecipeName, { image: imageData });
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

savePrepStepsBtn.addEventListener('click', () => {
    if (currentRecipeName) {
        const updatedSteps = recipeDetailsStepsTextarea.value;
        updateRecipeInDb(currentRecipeName, { steps: updatedSteps });
        editMessage.textContent = 'Preparation steps saved successfully!';
        editMessage.style.display = 'block';
    }
});

saveCategoryBtn.addEventListener('click', () => {
    if (currentRecipeName) {
        const updatedCategory = recipeDetailsCategorySelect.value;
        updateRecipeInDb(currentRecipeName, { category: updatedCategory });
        editMessage.textContent = 'Category saved successfully!';
        editMessage.style.display = 'block';
    }
});

// --- Meal Planner Functions ---

mealSelectors.forEach(selector => {
    selector.addEventListener('change', (e) => {
        const day = e.target.closest('.day').dataset.day;
        mealPlan[day] = e.target.value;
        localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
        
        const exportBtn = e.target.closest('.day').querySelector('.export-day-btn');
        if (e.target.value) {
            exportBtn.style.display = 'block';
        } else {
            exportBtn.style.display = 'none';
        }
    });
});

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
                    const currentQuantity = parseFloat(consolidatedList[key].quantity);
                    const newQuantity = parseFloat(ingredient.quantity);
                    if (!isNaN(currentQuantity) && !isNaN(newQuantity)) {
                        consolidatedList[key].quantity = currentQuantity + newQuantity;
                    } else if (ingredient.quantity) {
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

function renderGroceryList(list) {
    groceryListElem.innerHTML = '';
    shoppingListElem.innerHTML = '';
    groceryListControls.style.display = 'block';
    for (const key in list) {
        const item = list[key];
        const li = document.createElement('li');
        const quantityText = item.quantity ? `${item.quantity} ${item.unit}`.trim() : '';
        li.innerHTML = `<label><input type="checkbox" class="grocery-item-checkbox" data-item-name="${item.name}">${quantityText} ${item.name}</label>`;
        groceryListElem.appendChild(li);
    }
}

finalizeListBtn.addEventListener('click', () => {
    const checkboxes = groceryListElem.querySelectorAll('.grocery-item-checkbox');
    const shoppingList = [];
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const listItem = checkbox.closest('li');
            shoppingList.push(listItem.textContent.trim());
        }
    });
    renderShoppingList(shoppingList);
});

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
        let cookbookHTML = `<html><head><title>My Printable Cookbook</title><link rel="stylesheet" href="style.css"></head><body><header><h1>My Custom Cookbook</h1></header><main>`;
        cookbookRecipes.forEach(recipe => {
            const ingredientsList = recipe.ingredients.map(ing => `<li>${ing.quantity} ${ing.unit} ${ing.name}</li>`).join('');
            cookbookHTML += `<div class="cookbook-recipe"><h3>${recipe.name}</h3>${recipe.image ? `<img src="${recipe.image}" alt="${recipe.name} image">` : ''}<h4>Ingredients</h4><ul>${ingredientsList}</ul><h4>Preparation Steps</h4><p>${recipe.steps}</p></div>`;
        });
        cookbookHTML += `</main></body></html>`;
        const newWindow = window.open('', '_blank');
        newWindow.document.write(cookbookHTML);
        newWindow.document.close();
        newWindow.print();
    } else {
        alert("Please select at least one recipe to generate a cookbook.");
    }
});

// Initial render when the page loads
fetchRecipes();
