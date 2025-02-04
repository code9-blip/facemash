// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  query,
  orderBy,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

// DOM elements
const carImage1 = document.getElementById("carImage1");
const carImage2 = document.getElementById("carImage2");
const voteButton1 = document.getElementById("vote1");
const voteButton2 = document.getElementById("vote2");
const message = document.getElementById("message");
const leaderboardList = document.getElementById("leaderboardList");

let cars = []; // Array to store cars fetched from Firestore
let currentPair = []; // Array to store the current pair of cars being displayed

// Function to fetch cars from Firestore
async function fetchcars() {
  try {
    const carsSnapshot = await getDocs(collection(db, "cars"));
    const carsData = [];
    carsSnapshot.forEach((doc) => {
      carsData.push(doc.data());
    });
    return carsData;
  } catch (error) {
    console.error("Error fetching cars:", error);
    return [];
  }
}

// Function to get two random cars
function getRandomcars() {
  if (cars.length < 2) {
    console.error("Not enough cars to display.");
    return;
  }

  const randomIndex1 = Math.floor(Math.random() * cars.length);
  let randomIndex2 = Math.floor(Math.random() * cars.length);
  while (randomIndex2 === randomIndex1) {
    randomIndex2 = Math.floor(Math.random() * cars.length);
  }

  currentPair = [cars[randomIndex1], cars[randomIndex2]];
  carImage1.src = currentPair[0].image;
  carImage2.src = currentPair[1].image;

  // Add error handling for images
  carImage1.onerror = function () {
    this.src = "fallback.jpg"; // Fallback image if loading fails
    this.alt = "Failed to load image";
  };
  carImage2.onerror = function () {
    this.src = "fallback.jpg"; // Fallback image if loading fails
    this.alt = "Failed to load image";
  };
}

// Function to handle voting
async function vote(car) {
  try {
    // Disable buttons to prevent multiple votes
    voteButton1.disabled = true;
    voteButton2.disabled = true;

    // Update votes in Firestore
    const carRef = doc(db, "votes", car.id.toString());
    const docSnap = await getDoc(carRef);

    if (docSnap.exists()) {
      // If the document exists, increment the vote count
      await updateDoc(carRef, {
        votes: increment(1),
      });
    } else {
      // If the document doesn't exist, create it with an initial vote count of 1
      await setDoc(carRef, {
        id: car.id,
        votes: 1,
      });
    }

    // Show confirmation message
    message.textContent = `You voted for car ${car.id}!`;
    setTimeout(() => {
      message.textContent = "";
      getRandomcars(); // Load a new pair of cars
      voteButton1.disabled = false; // Re-enable buttons
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
  leaderboardList.innerHTML = "<li>Loading leaderboard...</li>"; // Show loading state

  try {
    // Fetch all votes from Firestore, ordered by votes in descending order
    const votesQuery = query(collection(db, "votes"), orderBy("votes", "desc"));
    const votesSnapshot = await getDocs(votesQuery);

    leaderboardList.innerHTML = ""; // Clear loading state
    votesSnapshot.forEach((doc) => {
      const li = document.createElement("li");

      // Create image element
      const img = document.createElement("img");
      const car = cars.find((c) => c.id === parseInt(doc.id));
      img.src = car ? car.image : "fallback.jpg"; // Use fallback if car not found
      img.alt = `car ${doc.id}`;

      // Create text element
      const span = document.createElement("span");
      span.textContent = `car ${doc.id}: ${doc.data().votes} votes`;

      // Append image and text to list item
      li.appendChild(img);
      li.appendChild(span);

      // Append list item to leaderboard
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

// Initialize the app
async function initializeApp() {
  cars = await fetchcars(); // Fetch cars from Firestore
  if (cars.length > 0) {
    getRandomcars(); // Load initial pair of cars
    updateLeaderboard(); // Load leaderboard on page load
  } else {
    console.error("No cars found in Firestore.");
  }
}

// Start the app
initializeApp();
