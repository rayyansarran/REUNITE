// API Configuration
const API_URL = 'http://localhost:5000/api';
const UPLOADS_URL = 'http://localhost:5000/uploads';

// Helper function to get profile picture URL
function getProfilePictureUrl(profilePicture) {
    if (profilePicture && 
        profilePicture !== 'uploads/default.jpg' && 
        profilePicture !== 'default-avatar.png' && 
        profilePicture !== 'uploads/default-avatar.png') {
        return `http://localhost:5000/${profilePicture}`;
    }
    return 'images/default-avatar.png';
}

// Check authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'index.html';
}

// DOM Elements
const profilePicture = document.getElementById('profilePicture');
const username = document.getElementById('username');
const profileForm = document.getElementById('profileForm');
const passwordForm = document.getElementById('passwordForm');
const deleteAccountForm = document.getElementById('deleteAccountForm');
const userPosts = document.getElementById('userPosts');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const menuItems = document.querySelectorAll('.menu-item');
const sections = document.querySelectorAll('.account-section');
const logoutBtn = document.getElementById('logoutBtn');
const tabButtons = document.querySelectorAll('.tab-btn');

// State
let currentPage = 1;
const postsPerPage = 5;
let totalPages = 1;
let currentTab = 'general';
let currentUser = null;

// Load user profile
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        currentUser = data;
        console.log('Profile data:', data);
        
        username.textContent = data.username;
        document.getElementById('usernameInput').value = data.username;
        document.getElementById('bioInput').value = data.bio || '';
        
        // Handle profile picture display
        profilePicture.src = getProfilePictureUrl(data.profilePicture);
    } catch (err) {
        console.error('Error loading profile:', err);
        alert('Error loading profile. Please try again.');
    }
}

// Load user posts
async function loadUserPosts(page = 1, tab = currentTab) {
    try {
        let url;
        
        // Determine endpoint based on tab
        if (tab === 'general') {
            url = `${API_URL}/users/posts/general`;
        } else if (tab === 'college-specific') {
            url = `${API_URL}/users/posts/college-specific`;
        }
        
        const response = await fetch(`${url}?page=${page}&limit=${postsPerPage}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Posts data:', data); // Debug log
        
        displayUserPosts(data.posts);
        totalPages = data.totalPages;
        currentPage = data.currentPage;
        updatePagination();
    } catch (err) {
        console.error('Error loading posts:', err);
        alert('Error loading posts. Please try again.');
    }
}

// Display user posts
function displayUserPosts(posts) {
    userPosts.innerHTML = '';
    
    if (!posts || posts.length === 0) {
        userPosts.innerHTML = '<p class="no-posts">You haven\'t created any posts yet.</p>';
        return;
    }

    posts.forEach(post => {
        const postElement = createPostElement(post);
        userPosts.appendChild(postElement);
    });
}

// Create post element
function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    
    // Safely handle Likes and Comments arrays
    const likes = Array.isArray(post.Likes) ? post.Likes : [];
    const comments = Array.isArray(post.Comments) ? post.Comments : [];
    const isLiked = currentUser && likes.some(like => like.User && like.User.id === currentUser.id);

    // College badge
    const collegeBadge = post.isCollegeSpecific ? `<span class="college-badge">College Specific</span>` : '';
    // Telegram button/icon
    const telegramBtn = post.telegramLink ?
        `<button class="telegram-btn" onclick="window.open('${post.telegramLink}', '_blank')" title="Join Telegram"><i class="fab fa-telegram-plane"></i></button>` :
        '<span class="telegram-btn disabled" title="No Telegram link"><i class="fab fa-telegram-plane"></i></span>';

    // User info badges
    const userInfo = post.User || {};
    const collegeName = userInfo.College ? userInfo.College.name : userInfo.collegeName;
    const careerStatus = userInfo.currentCareerStatus;
    const graduationYear = userInfo.yearOfGraduation;
    const bio = userInfo.bio || '';
    const userBadges = [];
    if (collegeName && collegeName !== 'College not specified') {
        userBadges.push(`<span class="badge college-name" title="${collegeName}">${collegeName}</span>`);
    }
    if (careerStatus && careerStatus !== 'Career status not specified') {
        userBadges.push(`<span class="badge career-status" title="${careerStatus}">${careerStatus}</span>`);
    }
    if (graduationYear && graduationYear !== 'Graduation year not specified') {
        userBadges.push(`<span class="badge graduation-year" title="Class of ${graduationYear}">Class of ${graduationYear}</span>`);
    }
    const badgesHtml = userBadges.length > 0 ? `<div class="user-badges">${userBadges.join('')}</div>` : '';
    // Bio with show more functionality
    const bioWords = bio.split(' ');
    const shortBio = bioWords.slice(0, 15).join(' ');
    const hasMoreBio = bioWords.length > 15;
    const bioHtml = bio ? `
        <div class="user-bio">
            <p class="bio-text" data-full-bio="${bio}" data-short-bio="${shortBio}">
                ${hasMoreBio ? shortBio + '...' : bio}
            </p>
            ${hasMoreBio ? '<button class="show-more-btn">Show more</button>' : ''}
        </div>
    ` : '';

    postDiv.innerHTML = `
        <div class="post-header">
            <img src="${getProfilePictureUrl(userInfo.profilePicture)}" alt="Profile Picture" class="profile-picture">
            <div class="post-info">
                <h3>${userInfo.username || 'Unknown User'}</h3>
                ${bioHtml}
                ${badgesHtml}
            </div>
            ${collegeBadge} ${telegramBtn}
        </div>
        <div class="post-content">
            <p>${post.content}</p>
            ${post.image ? `<img src="http://localhost:5000/${post.image}" alt="Post image" class="post-image">` : ''}
        </div>
        <div class="post-meta">
            <div class="post-time">${new Date(post.createdAt).toLocaleString()}</div>
        </div>
        <div class="post-actions">
            <button class="btn btn-like${isLiked ? ' liked' : ''}" data-post-id="${post.id}">
                <i class="fas fa-heart"></i> ${likes.length} Likes
            </button>
            <button class="btn btn-comment" data-post-id="${post.id}">
                <i class="fas fa-comment"></i> ${comments.length} Comments
            </button>
            <button class="btn btn-delete" data-post-id="${post.id}">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
        <div class="comments-section" id="comments-${post.id}">
            ${comments.map(comment => `
                <div class="comment">
                    <img src="${getProfilePictureUrl(comment.User?.profilePicture)}" alt="Profile Picture" class="profile-picture">
                    <div class="comment-content">
                        <h4>${comment.User?.username || 'Unknown User'}</h4>
                        <p>${comment.text || comment.content}</p>
                        <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                </div>
            `).join('') || ''}
        </div>
    `;

    // Add event listeners
    const likeBtn = postDiv.querySelector('.btn-like');
    const commentBtn = postDiv.querySelector('.btn-comment');
    const deleteBtn = postDiv.querySelector('.btn-delete');
    const showMoreBtn = postDiv.querySelector('.show-more-btn');

    if (likeBtn) likeBtn.addEventListener('click', () => handleLike(post.id));
    if (commentBtn) commentBtn.addEventListener('click', () => toggleComments(post.id));
    if (deleteBtn) deleteBtn.addEventListener('click', () => handleDelete(post.id));
    // Add show more functionality for bio
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', (e) => {
            const bioText = e.target.previousElementSibling;
            const fullBio = bioText.dataset.fullBio;
            const shortBio = bioText.dataset.shortBio;
            if (bioText.textContent.includes('...')) {
                bioText.textContent = fullBio;
                e.target.textContent = 'Show less';
            } else {
                bioText.textContent = shortBio + '...';
                e.target.textContent = 'Show more';
            }
        });
    }
    return postDiv;
}

// Update pagination controls
function updatePagination() {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

// Event Listeners
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        const profilePictureInput = document.getElementById('profilePictureInput');
        const usernameInput = document.getElementById('usernameInput');
        const bioInput = document.getElementById('bioInput');

        if (profilePictureInput.files[0]) {
            const file = profilePictureInput.files[0];
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
                return;
            }
            formData.append('profilePicture', file);
        }
        formData.append('username', usernameInput.value);
        formData.append('bio', bioInput.value);

        try {
            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }

            const data = await response.json();
            username.textContent = data.username;
            profilePicture.src = getProfilePictureUrl(data.profilePicture);
            alert('Profile updated successfully');
        } catch (err) {
            console.error('Error updating profile:', err);
            alert(err.message || 'Error updating profile. Please try again.');
        }
    });
}

if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            alert('Password updated successfully');
            passwordForm.reset();
        } catch (err) {
            console.error('Error updating password:', err);
            alert('Error updating password. Please try again.');
        }
    });
}

// Delete account form handler
if (deleteAccountForm) {
    deleteAccountForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('deletePassword').value;
        
        // Double confirmation for account deletion
        const confirmDelete = confirm(
            'Are you absolutely sure you want to delete your account?\n\n' +
            'This action is permanent and cannot be undone. All your posts, comments, and likes will be permanently removed.'
        );
        
        if (!confirmDelete) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users/account`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete account');
            }

            alert('Account deleted successfully');
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        } catch (err) {
            console.error('Error deleting account:', err);
            alert(err.message || 'Error deleting account. Please try again.');
        }
    });
}

// Menu navigation
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        const section = item.dataset.section;
        
        // Update active menu item
        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Show selected section
        sections.forEach(s => {
            s.classList.remove('active');
            if (s.id === `${section}-section`) {
                s.classList.add('active');
            }
        });

        // Load posts if posts section is selected
        if (section === 'posts') {
            loadUserPosts(currentPage);
        }
    });
});

// Tab switching
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        
        // Update active tab
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update current tab and load posts
        currentTab = tab;
        currentPage = 1; // Reset to first page when switching tabs
        loadUserPosts(currentPage, tab);
    });
});

// Pagination
if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            loadUserPosts(currentPage - 1, currentTab);
        }
    });
}

if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadUserPosts(currentPage + 1, currentTab);
        }
    });
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
}

// Function to handle post deletion (add this if it's missing)
async function handleDelete(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        try {
            const response = await fetch(`${API_URL}/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            alert('Post deleted successfully!');
            loadUserPosts(currentPage); // Reload posts for the current user
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post.');
        }
    }
}

// Initialize
loadUserProfile(); 