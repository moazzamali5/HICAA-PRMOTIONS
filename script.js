import {
    database,
    storage,
    ref,
    set,
    onValue,
    remove,
    storageRef,
    uploadBytes,
    getDownloadURL
} from './firebase-config.js';

// Admin password (in a real application, this should be handled server-side)
const ADMIN_PASSWORD = "bananacheese"; // You can change this password

// Area-specific filters
const areaFilters = {
    kuching: {
        'icom': 'ICOM SQUARE',
        'batu-kawa': 'BATU KAWA',
        'eion-mall': 'EION MALL',
        'emporium': 'EMPORIUM'
    },
    miri: {
        'permaisuri': 'PERMAISURI',
        'riam': 'RIAM'
    },
    sibu: {
        'town-square': 'TOWN SQUARE',
        'deltamall': 'BESIDE DELTAMALL',
        'star-megamall': 'STAR MEGAMALL',
        'unicity': 'UNICITY'
    }
};

// DOM Elements
const promotionsGrid = document.getElementById('promotionsGrid');
const filterButtons = document.querySelectorAll('.filter-btn');
const addPromotionBtn = document.getElementById('addPromotionBtn');
const promotionModal = document.getElementById('promotionModal');
const passwordModal = document.getElementById('passwordModal');
const deleteModal = document.getElementById('deleteModal');
const successModal = document.getElementById('successModal');
const deleteSuccessModal = document.getElementById('deleteSuccessModal');
const closeBtns = document.querySelectorAll('.close-btn');
const closeSuccessBtn = document.querySelector('.close-success-btn');
const closeDeleteSuccessBtn = document.querySelector('.close-delete-success-btn');
const passwordForm = document.getElementById('passwordForm');
const promotionForm = document.getElementById('promotionForm');
const cancelBtn = document.querySelector('.cancel-btn');
const deleteBtn = document.querySelector('.delete-btn');

// Add view modal elements
const viewPromotionModal = document.getElementById('viewPromotionModal');
const viewPromotionImage = document.getElementById('viewPromotionImage');
const viewPromotionHeading = document.getElementById('viewPromotionHeading');
const viewPromotionTitle = document.getElementById('viewPromotionTitle');
const viewPromotionDescription = document.getElementById('viewPromotionDescription');
const viewPromotionBranches = document.getElementById('viewPromotionBranches');

// Add area modal elements
const areaModal = document.getElementById('areaModal');
const selectedArea = document.getElementById('selectedArea');
const currentArea = document.getElementById('currentArea');
const filterContainer = document.getElementById('filterContainer');
let currentAreaValue = localStorage.getItem('selectedArea');

let currentPromotionId = null;
let isAdminVerified = false;
let promotions = [];

// Initialize Firebase and load promotions
function initializePromotions() {
    const promotionsRef = ref(database, 'promotions');
    
    // Listen for changes in the promotions data
    onValue(promotionsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            promotions = Object.entries(data).map(([id, promotion]) => ({
                id,
                ...promotion
            }));
        } else {
            promotions = [];
        }
        displayPromotions(document.querySelector('.filter-btn.active').dataset.filter);
    });
}

// Display promotions
function displayPromotions(filter = 'all') {
    promotionsGrid.innerHTML = '';
    
    // First filter by area
    let areaFilteredPromotions = promotions.filter(promo => {
        return promo.areas ? promo.areas.includes(currentAreaValue.toUpperCase()) : 
               promo.area === currentAreaValue.toUpperCase(); // For backward compatibility
    });

    // Then filter by branch if needed
    const filteredPromotions = filter === 'all' 
        ? areaFilteredPromotions 
        : areaFilteredPromotions.filter(promo => {
            return promo.branches.some(branch => {
                // Get the branch name from areaFilters for comparison
                const selectedArea = currentAreaValue.toLowerCase();
                const filterText = areaFilters[selectedArea][filter];
                
                // Compare with the full branch name (including area)
                const expectedBranchName = `${filterText}, ${currentAreaValue.toUpperCase()}`;
                return branch === expectedBranchName;
            });
        });

    filteredPromotions.forEach(promo => {
        const card = document.createElement('div');
        card.className = 'promotion-card';
        card.innerHTML = `
            <i class="fas fa-trash delete-icon" data-id="${promo.id}"></i>
            <img src="${promo.imageUrl}" alt="Promotion" class="promotion-image">
            <div class="promotion-content">
                <h3>${promo.heading}</h3>
                <p>${promo.title}</p>
                <div class="promotion-branches">
                    ${promo.branches.map(branch => `
                        <span class="branch-tag">${branch}</span>
                    `).join('')}
                </div>
            </div>
        `;

        // Add click event for viewing promotion details
        card.addEventListener('click', (e) => {
            // Don't show details if clicking delete icon
            if (!e.target.classList.contains('delete-icon')) {
                // Set modal content
                viewPromotionImage.src = promo.imageUrl;
                viewPromotionHeading.textContent = promo.heading;
                viewPromotionTitle.textContent = promo.title;
                viewPromotionDescription.textContent = promo.description;
                viewPromotionBranches.innerHTML = promo.branches
                    .map(branch => `<span class="branch-tag">${branch}</span>`)
                    .join('');

                // Show modal
                document.body.classList.add('modal-open');
                viewPromotionModal.style.display = 'block';
            }
        });

        promotionsGrid.appendChild(card);
    });

    // Add delete event listeners
    document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            showPasswordModal(() => {
                currentPromotionId = e.target.dataset.id;
                deleteModal.style.display = 'block';
            });
        });
    });

    // Show no results message if needed
    if (filteredPromotions.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
            <h3>No promotions found</h3>
            <p>There are currently no promotions for this ${filter === 'all' ? 'area' : 'branch'}.</p>
        `;
        promotionsGrid.appendChild(noResults);
    }
}

// Show password modal and execute callback on success
function showPasswordModal(callback) {
    if (isAdminVerified) {
        callback();
        return;
    }

    passwordModal.style.display = 'block';
    passwordForm.onsubmit = (e) => {
        e.preventDefault();
        const password = document.getElementById('adminPassword').value;
        if (password === ADMIN_PASSWORD) {
            isAdminVerified = true;
            passwordModal.style.display = 'none';
            callback();
        } else {
            alert('Incorrect admin password!');
        }
    };
}

// Filter promotions
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        displayPromotions(button.dataset.filter);
    });
});

// Modal functionality
addPromotionBtn.addEventListener('click', () => {
    showPasswordModal(() => {
        showModal(promotionModal);
    });
});

// Update modal display to handle history and animation
function showModal(modal) {
    document.body.classList.add('modal-open');
    modal.style.display = 'block';
    // Give browser time to register the display change before adding active class
    requestAnimationFrame(() => {
        modal.classList.add('active');
        if (modal === viewPromotionModal) {
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            viewPromotionModal.classList.add('active');
        }
    });
    history.pushState({ modal: true }, '');
}

function hideModal(modal) {
    document.body.classList.remove('modal-open');
    if (modal === viewPromotionModal) {
        modal.classList.remove('active');
        viewPromotionModal.classList.remove('active');
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        // Wait for animation to finish before hiding
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    } else {
        modal.style.display = 'none';
    }
}

// Update close handlers
closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        hideModal(btn.closest('.modal'));
    });
});

// Close view modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
});

// Handle back button for modals
window.addEventListener('popstate', () => {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (modal.style.display === 'block') {
            hideModal(modal);
        }
    });
});

// Add area selection change handler
function handleAreaChange() {
    const areaCheckboxes = document.querySelectorAll('input[name="area"]:checked');
    const branchesContainer = document.getElementById('branchesContainer');
    
    if (areaCheckboxes.length > 0) {
        // Create branch checkboxes for all selected areas
        const branchGroups = Array.from(areaCheckboxes).map(checkbox => {
            const area = checkbox.value;
            const areaFiltersObj = areaFilters[area.toLowerCase()];
            return `
                <div class="branch-area-group">
                    <h4>${area}</h4>
                    <div class="checkbox-group">
                        ${Object.entries(areaFiltersObj).map(([value, text]) => `
                            <label class="checkbox-label">
                                <input type="checkbox" name="branch" data-area="${area}" value="${value}">
                                ${text}
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        branchesContainer.innerHTML = branchGroups.join('');
    } else {
        branchesContainer.innerHTML = '<p>Please select at least one area first</p>';
    }
}

// Update form submission
promotionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const imageFile = document.getElementById('promotionImage').files[0];
    const heading = document.getElementById('promotionHeading').value.trim();
    const title = document.getElementById('promotionTitle').value.trim();
    const description = document.getElementById('promotionDescription').value.trim();
    const selectedAreas = Array.from(document.querySelectorAll('input[name="area"]:checked')).map(cb => cb.value);
    const branchCheckboxes = document.querySelectorAll('input[name="branch"]:checked');
    
    // Get the full branch names with their respective areas
    const branches = Array.from(branchCheckboxes).map(checkbox => {
        const branchName = checkbox.parentElement.textContent.trim();
        const area = checkbox.dataset.area;
        return `${branchName}, ${area}`;
    });

    // Validate all fields
    if (!imageFile) {
        alert('Please select an image for the promotion');
        return;
    }
    if (!heading) {
        alert('Please enter a promotion heading');
        return;
    }
    if (!title) {
        alert('Please enter a promotion title');
        return;
    }
    if (!description) {
        alert('Please enter a promotion description');
        return;
    }
    if (selectedAreas.length === 0) {
        alert('Please select at least one area');
        return;
    }
    if (branches.length === 0) {
        alert('Please select at least one branch');
        return;
    }

    try {
        // Upload image
        const imageStorageRef = storageRef(storage, `promotions/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageStorageRef, imageFile);
        const imageUrl = await getDownloadURL(imageStorageRef);

        // Save promotion data
        const promotionId = Date.now().toString();
        const promotionRef = ref(database, `promotions/${promotionId}`);
        await set(promotionRef, {
            id: promotionId,
            imageUrl,
            heading,
            title,
            description,
            areas: selectedAreas,
            branches,
            createdAt: Date.now()
        });

        // Show success modal
        successModal.style.display = 'block';
        promotionModal.style.display = 'none';
        promotionForm.reset();
        document.getElementById('branchesContainer').innerHTML = '<p>Please select at least one area first</p>';
    } catch (error) {
        console.error('Error adding promotion:', error);
        alert('Error adding promotion. Please try again.');
    }
});

// Delete functionality
cancelBtn.addEventListener('click', () => {
    deleteModal.style.display = 'none';
});

deleteBtn.addEventListener('click', async () => {
    if (currentPromotionId) {
        try {
            // Delete from Firebase Realtime Database
            const promotionRef = ref(database, `promotions/${currentPromotionId}`);
            await remove(promotionRef);
            
            deleteModal.style.display = 'none';
            deleteSuccessModal.style.display = 'block';
        } catch (error) {
            console.error('Error deleting promotion:', error);
            alert('Error deleting promotion. Please try again.');
        }
    }
});

// Update view modal close button handler
const viewModalCloseBtn = viewPromotionModal.querySelector('.close-btn');
viewModalCloseBtn.addEventListener('click', () => {
    viewPromotionModal.style.display = 'none';
    document.body.classList.remove('modal-open');
});

// Initialize area selection
function initializeArea() {
    const hasVisited = localStorage.getItem('hasVisited');
    
    if (!hasVisited || !currentAreaValue) {
        localStorage.setItem('hasVisited', 'true');
        areaModal.classList.add('show');
        areaModal.style.display = 'flex';
    } else {
        showAreaContent(currentAreaValue);
    }
}

// Show content for selected area
function showAreaContent(area) {
    currentAreaValue = area;
    localStorage.setItem('selectedArea', area);
    currentArea.textContent = area.toUpperCase();
    selectedArea.style.display = 'inline-flex';
    updateFilters(area);
    filterContainer.classList.add('show');
    areaModal.classList.remove('show');
    areaModal.style.display = 'none';
}

// Update filters based on selected area
function updateFilters(area) {
    const filters = areaFilters[area.toLowerCase()];
    const filterBtns = document.createElement('div');
    filterBtns.innerHTML = `
        <button class="filter-btn active" data-filter="all">ALL BRANCHES</button>
        ${Object.entries(filters).map(([value, text]) => `
            <button class="filter-btn" data-filter="${value}">${text}</button>
        `).join('')}
    `;
    
    filterContainer.innerHTML = filterBtns.innerHTML;
    addFilterListeners();
    displayPromotions('all'); // Refresh promotions for the new area
}

// Add event listeners for area selection
document.querySelectorAll('.area-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        showAreaContent(btn.dataset.area);
    });
});

// Allow changing area
selectedArea.addEventListener('click', () => {
    areaModal.classList.add('show');
    areaModal.style.display = 'flex';
});

// Add filter button listeners
function addFilterListeners() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            displayPromotions(button.dataset.filter);
        });
    });
}

// Success modal close handlers
closeSuccessBtn.addEventListener('click', () => {
    successModal.style.display = 'none';
    location.reload();
});

closeDeleteSuccessBtn.addEventListener('click', () => {
    deleteSuccessModal.style.display = 'none';
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to area checkboxes
    const areaCheckboxes = document.querySelectorAll('input[name="area"]');
    areaCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleAreaChange);
    });

    initializeArea();
    initializePromotions();
}); 