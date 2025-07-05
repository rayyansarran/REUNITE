// API Configuration
const API_URL = 'http://localhost:5000/api';

// DOM Elements
const authForms = document.getElementById('auth-forms');
const mainContent = document.getElementById('main-content');
const loginForm = document.getElementById('login-form');
const registerFormStep1 = document.getElementById('register-form-step1');
const registerFormStep2 = document.getElementById('register-form-step2');
const createPostBtn = document.getElementById('create-post-btn');
const createPostModal = document.getElementById('create-post-modal');
const closeModal = document.querySelector('.close');
const createPostForm = document.getElementById('create-post-form');
const postsContainer = document.getElementById('posts-container');
const logoutBtn = document.getElementById('logout-btn');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const collegeSelect = document.getElementById('register-college');
const nextStepBtn = document.getElementById('next-step');
const prevStepBtn = document.getElementById('prev-step');
const graduationYearSelect = document.getElementById('register-graduation-year');

// State
let currentUser = null;
let userStatus = null;

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

// Helper function to get current token
function getToken() {
    return localStorage.getItem('token');
}

// Helper function to set token
function setToken(token) {
    localStorage.setItem('token', token);
}

// Helper function to remove token
function removeToken() {
    localStorage.removeItem('token');
}

// Helper function to get user status
async function getUserStatus() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        if (response.ok) {
            const userData = await response.json();
            userStatus = userData.status;
            return userData.status;
        }
        return null;
    } catch (err) {
        console.error('Error getting user status:', err);
        return null;
    }
}

// Load colleges for registration
async function loadColleges() {
    try {
        const response = await fetch(`${API_URL}/colleges`);
        const colleges = await response.json();
        
        collegeSelect.innerHTML = '<option value="">Select your college</option>';
        colleges.forEach(college => {
            const option = document.createElement('option');
            option.value = college.id;
            option.textContent = college.name;
            collegeSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading colleges:', err);
    }
}

// Load graduation years
function loadGraduationYears() {
    const currentYear = new Date().getFullYear();
    graduationYearSelect.innerHTML = '<option value="">Select graduation year</option>';
    
    // Add years from 1960 to current year + 5
    for (let year = currentYear + 5; year >= 1960; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        graduationYearSelect.appendChild(option);
    }
}

// Handle next step in registration
function handleNextStep() {
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const collegeId = collegeSelect.value;

    if (!username || !email || !password || !collegeId) {
        alert('Please fill in all required fields');
        return;
    }

    // Store step 1 data in sessionStorage
    sessionStorage.setItem('registerData', JSON.stringify({
        username,
        email,
        password,
        collegeId
    }));

    // Show step 2
    registerFormStep1.classList.add('hidden');
    registerFormStep2.classList.remove('hidden');
}

// Handle previous step in registration
function handlePrevStep() {
    registerFormStep2.classList.add('hidden');
    registerFormStep1.classList.remove('hidden');
}

// Check authentication
async function checkAuth() {
    const token = getToken();
    if (!token) {
        // No token exists, show auth forms
        showAuthForms();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            userStatus = currentUser.status;
            
            // Check if user is admin and redirect accordingly
            if (currentUser.role === 'admin') {
                // Redirect admin to admin system
                window.location.href = '../admin_system.html';
            } else {
                // Regular user - show main content
                showMainContent();
                updateNavbarStatus();
                updateUIForUserStatus();
                loadPosts();
            }
        } else {
            // Token is invalid or expired, remove it and show auth forms
            removeToken();
            showAuthForms();
        }
    } catch (err) {
        // Error fetching user data, remove token and show auth forms
        removeToken();
        showAuthForms();
    }
}

// Show main content
function showMainContent() {
    authForms.classList.add('hidden');
    mainContent.classList.remove('hidden');
    document.getElementById('navbar').classList.remove('hidden');
}

// Show auth forms
function showAuthForms() {
    authForms.classList.remove('hidden');
    mainContent.classList.add('hidden');
    document.getElementById('navbar').classList.add('hidden');
}

// Update navbar with account status
function updateNavbarStatus() {
    const navbar = document.getElementById('navbar');
    const navLinks = navbar.querySelector('.nav-links');
    
    // Remove existing status label if any
    const existingStatus = navbar.querySelector('.status-label');
    if (existingStatus) {
        existingStatus.remove();
    }

    // Only show status label for pending or deactive users
    if (userStatus === 'pending' || userStatus === 'deactive') {
        const statusLabel = document.createElement('div');
        statusLabel.className = 'status-label';
        statusLabel.textContent = userStatus === 'pending' ? 'Pending' : 'Refute';
        statusLabel.setAttribute('data-tooltip', userStatus === 'pending'
            ? 'Your account is being verified by our team. It may take 3 working days.'
            : 'You couldn\'t verify your claims. Delete this account and try again with correct information or mail to reunite@email.com.');
        // Insert status label before the profile link
        const profileLink = navLinks.querySelector('#navbarProfileLink');
        navLinks.insertBefore(statusLabel, profileLink);
    }
}

// Update UI based on user status
function updateUIForUserStatus() {
    const createPostBtn = document.getElementById('create-post-btn');
    const likeButtons = document.querySelectorAll('.like-btn');
    const commentButtons = document.querySelectorAll('.comment-btn');
    const commentForms = document.querySelectorAll('.comment-form');

    if (userStatus === 'pending' || userStatus === 'deactive') {
        // Disable create post button
        if (createPostBtn) {
            createPostBtn.disabled = true;
            createPostBtn.title = userStatus === 'pending' 
                ? 'Your account is pending verification. You cannot create posts until activated.'
                : 'Your account has been deactivated. You cannot create posts.';
            createPostBtn.style.opacity = '0.5';
            createPostBtn.style.cursor = 'not-allowed';
        }

        // Disable like buttons
        likeButtons.forEach(btn => {
            btn.disabled = true;
            btn.title = userStatus === 'pending'
                ? 'Your account is pending verification. You cannot like posts until activated.'
                : 'Your account has been deactivated. You cannot like posts.';
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });

        // Disable comment buttons and forms
        commentButtons.forEach(btn => {
            btn.disabled = true;
            btn.title = userStatus === 'pending'
                ? 'Your account is pending verification. You cannot comment until activated.'
                : 'Your account has been deactivated. You cannot comment.';
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });

        commentForms.forEach(form => {
            const input = form.querySelector('input');
            const submitBtn = form.querySelector('button');
            if (input) input.disabled = true;
            if (submitBtn) submitBtn.disabled = true;
        });
    } else {
        // Enable all interactive elements for active users
        if (createPostBtn) {
            createPostBtn.disabled = false;
            createPostBtn.title = '';
            createPostBtn.style.opacity = '1';
            createPostBtn.style.cursor = 'pointer';
        }

        likeButtons.forEach(btn => {
            btn.disabled = false;
            btn.title = '';
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });

        commentButtons.forEach(btn => {
            btn.disabled = false;
            btn.title = '';
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });

        commentForms.forEach(form => {
            const input = form.querySelector('input');
            const submitBtn = form.querySelector('button');
            if (input) input.disabled = false;
            if (submitBtn) submitBtn.disabled = false;
        });
    }
}

// Load posts
async function loadPosts(filter = 'general') {
    try {
        let url = `${API_URL}/posts/general`;
        if (filter === 'my-college') {
            // Check user status before allowing college-specific posts
            const status = await getUserStatus();
            if (status === 'pending') {
                alert('Your account isn\'t active yet. You will be able to see college-specific posts once your account is activated. It usually takes around 3 working days. Your account might get rejected also. If your account is rejected, delete your account and try again with correct information or mail to reunite@email.com.');
                return;
            } else if (status === 'deactive') {
                alert('Your account has been rejected. You couldn\'t verify your claims. Please delete this account and try again with correct information or mail to reunite@email.com.');
                return;
            }
            url = `${API_URL}/posts/college-specific`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (response.ok) {
            const posts = await response.json();
            displayPosts(posts);
        } else {
            console.error('Error loading posts');
        }
    } catch (err) {
        console.error('Error loading posts:', err);
    }
}

// Display posts
function displayPosts(posts) {
    postsContainer.innerHTML = '';
    
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        
        // Safely handle Likes and Comments arrays
        const likes = Array.isArray(post.Likes) ? post.Likes : [];
        const comments = Array.isArray(post.Comments) ? post.Comments : [];
        const isLiked = likes.some(like => like.User && like.User.id === currentUser.id);
        
        // Add college-specific badge if applicable
        const collegeBadge = post.isCollegeSpecific ? 
            `<span class="college-badge">College Specific</span>` : '';
        // Telegram button/icon
        const telegramBtn = post.telegramLink ?
            `<button class="telegram-btn" onclick="window.open('${post.telegramLink}', '_blank')" title="Join Telegram"><i class="fab fa-telegram-plane"></i></button>` :
            '<span class="telegram-btn disabled" title="No Telegram link"><i class="fab fa-telegram-plane"></i></span>';
        
        // User info badges - only show if data is available
        const userInfo = post.User;
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
        
        postElement.innerHTML = `
        <div class="post-header">
                <img src="${getProfilePictureUrl(post.User.profilePicture)}" alt="Profile" class="profile-picture">
                <div class="post-info">
                    <h3>${post.User.username}</h3>
                    ${bioHtml}
                    ${badgesHtml}
                </div>
                ${collegeBadge} ${telegramBtn}
        </div>
        <div class="post-content">
            <p>${post.content}</p>
                ${post.image ? `<img src="http://localhost:5000/${post.image}" alt="Post image">` : ''}
        </div>
        <div class="post-meta">
            <div class="post-time">${new Date(post.createdAt).toLocaleString()}</div>
        </div>
        <div class="post-actions">
                <button class="like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                    <i class="fas fa-heart"></i> ${likes.length} Likes
            </button>
                <button class="comment-btn" data-post-id="${post.id}">
                    <i class="fas fa-comment"></i> ${comments.length} Comments
            </button>
        </div>
        <div class="comments-section hidden" id="comments-${post.id}">
            <div class="comments-list">
                ${comments.map(comment => `
                    <div class="comment">
                        <img src="${getProfilePictureUrl(comment.User.profilePicture)}" alt="Profile" class="profile-picture">
                        <div class="comment-content">
                            <h4>${comment.User.username}</h4>
                            <p>${comment.text}</p>
                            <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <form class="comment-form" data-post-id="${post.id}">
                <input type="text" placeholder="Write a comment..." required>
                <button type="submit">Comment</button>
            </form>
        </div>
    `;

        postsContainer.appendChild(postElement);

        // Add event listeners for this post
        const likeBtn = postElement.querySelector('.like-btn');
        const commentBtn = postElement.querySelector('.comment-btn');
        const commentForm = postElement.querySelector('.comment-form');
        const showMoreBtn = postElement.querySelector('.show-more-btn');

        likeBtn.addEventListener('click', () => handleLike(post.id));
        commentBtn.addEventListener('click', () => toggleComments(post.id));
        commentForm.addEventListener('submit', (e) => handleComment(e, post.id));
        
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
    });

    // Update UI based on user status after posts are displayed
    updateUIForUserStatus();
}

// Handle likes
async function handleLike(postId) {
    try {
        const response = await fetch(`${API_URL}/posts/like/${postId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (response.ok) {
            loadPosts(); // Reload posts to update like count
        } else {
            const data = await response.json();
            if (response.status === 403) {
                alert(data.message);
            } else {
                alert(data.message || 'Error liking post');
            }
        }
    } catch (err) {
        console.error('Error liking post:', err);
        alert('Error liking post');
    }
}

// Toggle comments section
function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    commentsSection.classList.toggle('hidden');
}

// Handle comments
async function handleComment(e, postId) {
    e.preventDefault();
    const text = e.target[0].value.trim();

    if (!text) {
        alert('Comment cannot be empty');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ text })
        });

        if (response.ok) {
            e.target.reset();
            // Get the updated post with comments
            const updatedPost = await response.json();
            
            // Update the comments section for this post
            const commentsSection = document.getElementById(`comments-${postId}`);
            const commentsList = commentsSection.querySelector('.comments-list');
            const commentBtn = document.querySelector(`[data-post-id="${postId}"].comment-btn`);
            
            // Update comments list
            commentsList.innerHTML = updatedPost.Comments.map(comment => `
                <div class="comment">
                    <img src="${getProfilePictureUrl(comment.User.profilePicture)}" alt="Profile" class="profile-picture">
                    <div class="comment-content">
                        <h4>${comment.User.username}</h4>
                        <p>${comment.text}</p>
                        <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                </div>
            `).join('');
            
            // Update comment count
            commentBtn.innerHTML = `<i class="fas fa-comment"></i> ${updatedPost.Comments.length} Comments`;
        } else {
            const data = await response.json();
            if (response.status === 403) {
                alert(data.message);
            } else {
                alert(data.message || 'Error posting comment');
            }
        }
    } catch (err) {
        console.error('Error commenting:', err);
        alert('Error posting comment');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    if (getToken()) {
        checkAuth();
    }

    // Form Submissions
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target[0].value;
        const password = e.target[1].value;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                setToken(data.token);
                currentUser = data.user;
                userStatus = data.user.status;
                
                // Check if user is admin and redirect accordingly
                if (data.user.role === 'admin') {
                    // Redirect admin to admin system
                    window.location.href = '../admin_system.html';
                } else {
                    // Regular user - show main content
                    showMainContent();
                    updateNavbarStatus();
                    updateUIForUserStatus();
                    loadPosts();
                }
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (err) {
            alert('Error logging in');
        }
    });

    document.getElementById('register-form-step1').addEventListener('submit', async (e) => {
        e.preventDefault();
        handleNextStep();
    });

    document.getElementById('register-form-step2').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get data from both steps
        const step1Data = JSON.parse(sessionStorage.getItem('registerData') || '{}');
        const firstName = document.getElementById('register-firstname').value;
        const lastName = document.getElementById('register-lastname').value;
        const phoneNumber = document.getElementById('register-phone').value;
        const graduationYear = graduationYearSelect.value;
        const careerStatus = document.getElementById('register-career-status').value;
        const linkedinUrl = document.getElementById('register-linkedin').value;
        const studentEmail = document.getElementById('register-student-email').value;

        if (!firstName || !lastName || !graduationYear || !careerStatus) {
            alert('Please fill in all required fields');
            return;
        }

        // Combine all data
        const registrationData = {
            ...step1Data,
            firstName,
            lastName,
            phoneNumber,
            yearOfGraduation: parseInt(graduationYear),
            currentCareerStatus: careerStatus,
            linkedinProfileUrl: linkedinUrl || null,
            studentMailId: studentEmail || null
        };

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registrationData)
            });

            const data = await response.json();
            if (response.ok) {
                setToken(data.token);
                currentUser = data.user;
                userStatus = data.user.status;
                sessionStorage.removeItem('registerData'); // Clear stored data
                
                // Check if user is admin and redirect accordingly
                if (data.user.role === 'admin') {
                    // Redirect admin to admin system
                    window.location.href = '../admin_system.html';
                } else {
                    // Regular user - show main content
                    showMainContent();
                    updateNavbarStatus();
                    updateUIForUserStatus();
                    loadPosts();
                }
            } else {
                alert(data.message || 'Registration failed');
            }
        } catch (err) {
            console.error('Error registering:', err);
            alert('Error registering');
        }
    });

    createPostForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const content = document.getElementById('post-content').value.trim();
        const isCollegeSpecific = document.getElementById('is-college-specific').checked;
        const telegramLink = document.getElementById('post-telegram-link').value.trim();
        const imageInput = document.getElementById('post-image');
        const formData = new FormData();
        formData.append('content', content);
        formData.append('isCollegeSpecific', isCollegeSpecific);
        if (telegramLink) formData.append('telegramLink', telegramLink);
        if (imageInput.files[0]) formData.append('image', imageInput.files[0]);
        try {
            const response = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                },
                body: formData
            });
            if (response.ok) {
                createPostModal.classList.add('hidden');
                createPostForm.reset();
                loadPosts();
            } else {
                const data = await response.json();
                alert(data.error || 'Error creating post');
            }
        } catch (err) {
            alert('Error creating post');
        }
    });

    // Image Preview
    document.getElementById('post-image').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('image-preview');
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    // Initialize
    loadColleges();
    loadGraduationYears();

    // Add filter buttons
    const filterButtons = document.createElement('div');
    filterButtons.className = 'filter-buttons';
    filterButtons.innerHTML = `
        <button class="filter-btn active" data-filter="general">General Posts</button>
        <button class="filter-btn" data-filter="my-college">My College</button>
    `;
    postsContainer.parentElement.insertBefore(filterButtons, postsContainer);

    // Modal for blocked college access
    const collegeBlockedModal = document.getElementById('college-blocked-modal');
    const collegeBlockedMessage = document.getElementById('college-blocked-message');
    const closeBlockedModal = document.getElementById('close-blocked-modal');

    // Add event listeners for filter buttons
    filterButtons.addEventListener('click', async (e) => {
        if (e.target.classList.contains('filter-btn')) {
            const filter = e.target.dataset.filter;
            
            // Check user status before allowing college-specific posts
            if (filter === 'my-college') {
                const status = await getUserStatus();
                if (status === 'pending') {
                    collegeBlockedMessage.textContent = "Your account isn't active yet. You will be able to see My College posts once your account is activated. It usually takes around 3 working days. Your account might get rejected also. If your account is refuted, delete your account and try again with correct information or mail to reunite@email.com.";
                    collegeBlockedModal.classList.remove('hidden');
                    return;
                } else if (status === 'deactive') {
                    collegeBlockedMessage.textContent = "You couldn't verify your claims. Delete this account and try again with correct information or mail to reunite@email.com.";
                    collegeBlockedModal.classList.remove('hidden');
                    return;
                }
            }
            
            // Update active button
            filterButtons.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            // Load posts with the selected filter
            loadPosts(filter);
        }
    });

    closeBlockedModal.addEventListener('click', () => {
        collegeBlockedModal.classList.add('hidden');
    });

    // Navigation event listeners
    nextStepBtn.addEventListener('click', handleNextStep);
    prevStepBtn.addEventListener('click', handlePrevStep);
});

// Form switching event listeners
showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerFormStep1.classList.remove('hidden');
    registerFormStep2.classList.add('hidden');
    sessionStorage.removeItem('registerData');
    loadColleges();
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerFormStep1.classList.add('hidden');
    registerFormStep2.classList.add('hidden');
    loginForm.classList.remove('hidden');
    sessionStorage.removeItem('registerData');
});

// Modal event listeners
createPostBtn.addEventListener('click', () => {
    createPostModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    createPostModal.classList.add('hidden');
});

// Logout event listener
logoutBtn.addEventListener('click', () => {
    removeToken();
    sessionStorage.removeItem('registerData');
    showAuthForms();
});