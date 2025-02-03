// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC1Ma0F8xQVQOUxmHi374LPCO6pgsoFD74",
    authDomain: "facemashx9.firebaseapp.com",
    projectId: "facemashx9",
    storageBucket: "facemashx9.appspot.com",
    messagingSenderId: "429966268476",
    appId: "1:429966268476:web:deca9c835849a085a68b39",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Costumes data
const costumes = [
    { id: 1, image: "costume1.jpg", votes: 0 },
    { id: 2, image: "costume2.jpg", votes: 0 },
    { id: 3, image: "costume3.jpg", votes: 0 },
    { id: 4, image: "costume4.jpg", votes: 0 },
];

// DOM elements
const costumeImage1 = document.getElementById("costumeImage1");
const costumeImage2 = document.getElementById("costumeImage2");
const voteButton1 = document.getElementById("vote1");
const voteButton2 = document.getElementById("vote2");
const message = document.getElementById("message");

let currentPair = [];

// Function to get two random costumes
function getRandomCostumes() {
    const randomIndex1 = Math.floor(Math.random() * costumes.length);
    let randomIndex2 = Math.floor(Math.random() * costumes.length);
    while (randomIndex2 === randomIndex1) {
        randomIndex2 = Math.floor(Math.random() * costumes.length);
    }
    currentPair = [costumes[randomIndex1], costumes[randomIndex2]];
    costumeImage1.src = currentPair[0].image;
    costumeImage2.src = currentPair[1].image;

    // Add error handling for images
    costumeImage1.onerror = function () {
        this.src = "fallback.jpg"; // Fallback image if loading fails
        this.alt = "Failed to load image";
    };
    costumeImage2.onerror = function () {
        this.src = "fallback.jpg"; // Fallback image if loading fails
        this.alt = "Failed to load image";
    };
}

// Function to handle voting
async function vote(costume) {
    try {
        // Disable buttons
        voteButton1.disabled = true;
        voteButton2.disabled = true;

        // Update votes in Firestore
        const costumeRef = db.collection("votes").doc(costume.id.toString());
        const doc = await costumeRef.get();

        if (doc.exists) {
            await costumeRef.update({
                votes: firebase.firestore.FieldValue.increment(1),
            });
        } else {
            await costumeRef.set({
                id: costume.id,
                votes: 1,
            });
        }

        // Show confirmation message
        message.textContent = `You voted for Costume ${costume.id}!`;
        setTimeout(() => {
            message.textContent = "";
            getRandomCostumes();
            // Re-enable buttons
            voteButton1.disabled = false;
            voteButton2.disabled = false;
        }, 2000);

        // Update the leaderboard
        updateLeaderboard();
    } catch (error) {
        console.error("Error voting:", error);
        message.textContent = "Failed to vote. Please try again.";
        // Re-enable buttons in case of error
        voteButton1.disabled = false;
        voteButton2.disabled = false;
    }
}

// Function to update the leaderboard
async function updateLeaderboard() {
    const leaderboardList = document.getElementById("leaderboardList");
    leaderboardList.innerHTML = "<li>Loading leaderboard...</li>"; // Show loading state

    try {
        // Fetch all votes from Firestore, ordered by votes in descending order
        const votesSnapshot = await db
            .collection("votes")
            .orderBy("votes", "desc")
            .get();

        leaderboardList.innerHTML = ""; // Clear loading state
        votesSnapshot.forEach((doc) => {
            const li = document.createElement("li");
            li.textContent = `Costume ${doc.id}: ${doc.data().votes} votes`;
            leaderboardList.appendChild(li);
        });
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        leaderboardList.innerHTML = "<li>Failed to load leaderboard. Please try again.</li>";
    }
}

// Event listeners for voting buttons
voteButton1.addEventListener("click", () => vote(currentPair[0]));
voteButton2.addEventListener("click", () => vote(currentPair[1]));

// Load initial pair of costumes
getRandomCostumes();

// Load leaderboard on page load
updateLeaderboard();
