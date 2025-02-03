// script.js
const costumes = [
    { id: 1, image: "costume1.jpg", votes: 0 },
    { id: 2, image: "costume2.jpg", votes: 0 },
    { id: 3, image: "costume3.jpg", votes: 0 },
    { id: 4, image: "costume4.jpg", votes: 0 },
];

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
}

// Function to handle voting
function vote(costume) {
    costume.votes++;
    message.textContent = `You voted for Costume ${costume.id}!`;
    setTimeout(() => {
        message.textContent = "";
        getRandomCostumes();
    }, 2000);
}

// Event listeners for voting buttons
voteButton1.addEventListener("click", () => vote(currentPair[0]));
voteButton2.addEventListener("click", () => vote(currentPair[1]));

// Load initial pair of costumes
getRandomCostumes();