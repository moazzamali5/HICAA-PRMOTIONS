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
    
    const filteredPromotions = filter === 'all' 
        ? promotions 
        : promotions.filter(promo => promo.branches.includes(filter));

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
                        <span class="branch-tag">${branch.toUpperCase()}</span>
                    `).join('')}
                </div>
            </div>
        `;

        // Add click event for viewing promotion details
        card.addEventListener('click', (e) => {
            // Don't show details if clicking delete icon
            if (!e.target.classList.contains('delete-icon')) {
                viewPromotionImage.src = promo.imageUrl;
                viewPromotionHeading.textContent = promo.heading;
                viewPromotionTitle.textContent = promo.title;
                viewPromotionDescription.textContent = promo.description;
                viewPromotionBranches.innerHTML = promo.branches
                    .map(branch => `<span class="branch-tag">${branch.toUpperCase()}</span>`)
                    .join('');
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
        promotionModal.style.display = 'block';
    });
});

// Close modals
closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        promotionModal.style.display = 'none';
        passwordModal.style.display = 'none';
        deleteModal.style.display = 'none';
        successModal.style.display = 'none';
        deleteSuccessModal.style.display = 'none';
    });
});

closeSuccessBtn.addEventListener('click', () => {
    successModal.style.display = 'none';
    window.location.reload();
});

closeDeleteSuccessBtn.addEventListener('click', () => {
    deleteSuccessModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === promotionModal) {
        promotionModal.style.display = 'none';
    }
    if (e.target === passwordModal) {
        passwordModal.style.display = 'none';
    }
    if (e.target === deleteModal) {
        deleteModal.style.display = 'none';
    }
    if (e.target === successModal) {
        successModal.style.display = 'none';
        window.location.reload();
    }
    if (e.target === deleteSuccessModal) {
        deleteSuccessModal.style.display = 'none';
    }
});

// Handle form submission
promotionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const imageFile = document.getElementById('promotionImage').files[0];
    const heading = document.getElementById('promotionHeading').value.trim();
    const title = document.getElementById('promotionTitle').value.trim();
    const description = document.getElementById('promotionDescription').value.trim();
    const branches = Array.from(document.querySelectorAll('input[name="branch"]:checked'))
        .map(checkbox => checkbox.value);

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
            branches,
            createdAt: Date.now()
        });

        // Show success modal
        successModal.style.display = 'block';
        promotionModal.style.display = 'none';
        promotionForm.reset();
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

// Close view modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === viewPromotionModal) {
        // Only close if clicking directly on the modal background
        if (e.target === e.currentTarget) {
            viewPromotionModal.style.display = 'none';
        }
    }
});

// Add close button for view modal
const viewModalCloseBtn = viewPromotionModal.querySelector('.close-btn');
viewModalCloseBtn.addEventListener('click', () => {
    viewPromotionModal.style.display = 'none';
});

// Initialize the application
initializePromotions(); 
