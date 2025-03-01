// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

// Initialize an empty array for cars
let cars = [];

// DOM elements
const carImage1 = document.getElementById("carImage1");
const carImage2 = document.getElementById("carImage2");
const carName1 = document.getElementById("carName1");
const carName2 = document.getElementById("carName2");
const voteButton1 = document.getElementById("vote1");
const voteButton2 = document.getElementById("vote2");
const message = document.getElementById("message");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const leaderboardList = document.getElementById("leaderboardList");
const totalVotesElement = document.getElementById("totalVotes");

let allPairs = []; // All possible unique pairs
let remainingPairs = []; // Pairs that haven't been shown yet
let currentPair = [];

// Load cars data
async function loadCars() {
    try {
        const response = await fetch("cars.json");
        if (!response.ok) {
            throw new Error("Failed to load cars data");
        }
        cars = await response.json();
        console.log("Cars loaded successfully:", cars);

        // Generate all possible unique pairs
        generateAllPairs();
        getRandomPair();
        updateLeaderboard();
    } catch (error) {
        console.error("Error loading cars data:", error);
        message.textContent = "Failed to load cars data. Please try again later.";
        setTimeout(() => {
            message.textContent = "";
        }, 3000);
    }
}

// Generate all possible unique pairs
function generateAllPairs() {
    allPairs = [];
    for (let i = 0; i < cars.length; i++) {
        for (let j = i + 1; j < cars.length; j++) {
            allPairs.push([cars[i], cars[j]]);
        }
    }
    console.log("Total unique pairs generated:", allPairs.length);

    // Shuffle the pairs to randomize the order
    allPairs = shuffleArray(allPairs);
    remainingPairs = [...allPairs]; // Initialize remaining pairs
}

// Shuffle an array using the Fisher-Yates algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Get a random pair of cars
function getRandomPair() {
    if (remainingPairs.length === 0) {
        // If no pairs are left, reset the list
        message.textContent = "All pairs have been shown. Resetting pairs...";
        setTimeout(() => {
            message.textContent = "";
            remainingPairs = [...allPairs]; // Reset remaining pairs
            getRandomPair(); // Show a new pair
        }, 2000);
        return;
    }

    // Select the first pair from the remaining pairs
    currentPair = remainingPairs.shift(); // Remove the pair from the list

    // Update the UI
    carImage1.src = currentPair[0].image;
    carImage2.src = currentPair[1].image;
    carName1.textContent = currentPair[0].name;
    carName2.textContent = currentPair[1].name;

    console.log("New pair loaded:", currentPair);

    // Add error handling for images
    carImage1.onerror = function () {
        this.src = "fallback.jpg"; // Fallback image if the original fails to load
        this.alt = "Failed to load image";
    };
    carImage2.onerror = function () {
        this.src = "fallback.jpg"; // Fallback image if the original fails to load
        this.alt = "Failed to load image";
    };
}

// Handle voting
async function vote(car) {
    try {
        // Disable buttons
        voteButton1.disabled = true;
        voteButton2.disabled = true;

        // Update votes in Firestore
        const carRef = doc(db, "votes", car.id.toString());
        const docSnap = await getDoc(carRef);

        if (docSnap.exists()) {
            await updateDoc(carRef, {
                votes: increment(1),
            });
            console.log(`Vote updated for car ${car.id}: ${docSnap.data().votes + 1}`);
        } else {
            await setDoc(carRef, {
                id: car.id,
                votes: 1,
            });
            console.log(`New vote created for car ${car.id}: 1`);
        }

        // Show confirmation message
        message.textContent = `You voted for ${car.name}!`;
        setTimeout(() => {
            message.textContent = "";
        }, 2000);

        // Immediately load a new pair of cars
        getRandomPair();

        // Re-enable buttons
        voteButton1.disabled = false;
        voteButton2.disabled = false;

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

// Search for a car by name
async function searchCar() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (!searchTerm) {
        message.textContent = "Please enter a car name to search.";
        setTimeout(() => {
            message.textContent = "";
        }, 2000);
        return;
    }

    try {
        // Fetch all votes from Firestore
        const votesQuery = query(collection(db, "votes"));
        const votesSnapshot = await getDocs(votesQuery);

        // Create a map of car IDs to their vote counts
        const voteMap = new Map();
        votesSnapshot.forEach(doc => {
            voteMap.set(doc.id, doc.data().votes);
        });

        // Find all cars that match the search term
        const foundCars = cars
            .filter(car => car.name.toLowerCase().includes(searchTerm))
            .map(car => ({
                name: car.name,
                votes: voteMap.get(car.id.toString()) || 0, // Default to 0 if no votes
                image: car.image,
            }));

        if (foundCars.length > 0) {
            // Display all matching cars
            message.innerHTML = foundCars.map(car => `
                <strong>${car.name}</strong><br>
                Votes: ${car.votes}<br>
                <img src="${car.image}" alt="${car.name}" style="width: 200px; margin-top: 10px;">
            `).join("<hr>");
        } else {
            message.textContent = "No cars found with that name.";
            setTimeout(() => {
                message.textContent = "";
            }, 2000);
        }
    } catch (error) {
        console.error("Error searching for car:", error);
        message.textContent = "Failed to search. Please try again.";
    }
}

// Update the leaderboard
async function updateLeaderboard() {
    leaderboardList.innerHTML = "<li>Loading leaderboard...</li>";

    try {
        const votesQuery = query(collection(db, "votes"));
        const votesSnapshot = await getDocs(votesQuery);

        const voteMap = new Map();
        let totalVotes = 0;
        votesSnapshot.forEach(doc => {
            voteMap.set(doc.id, doc.data().votes);
            totalVotes += doc.data().votes;
        });

        const carsWithVotes = cars.map(car => ({
            ...car,
            votes: voteMap.get(car.id.toString()) || 0,
        }));

        carsWithVotes.sort((a, b) => b.votes - a.votes);

        leaderboardList.innerHTML = "";
        carsWithVotes.forEach(car => {
            const li = document.createElement("li");
            li.textContent = `${car.name}: ${car.votes} votes`;
            leaderboardList.appendChild(li);
        });

        totalVotesElement.textContent = totalVotes;
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        leaderboardList.innerHTML = "<li>Failed to load leaderboard. Please try again.</li>";
    }
}

// Event listeners
voteButton1.addEventListener("click", () => vote(currentPair[0]));
voteButton2.addEventListener("click", () => vote(currentPair[1]));
searchButton.addEventListener("click", searchCar);
searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        searchCar();
    }
});

// Load cars data and initialize the app
loadCars();
