let strtBtn = document.querySelector("#start-btn");
let playerConfirmation = document.querySelector(".playerConfirmation");//This gets the Div of playerselection.
let confirmPlayerBtn = document.querySelector("#confirm")
const playerInput = document.getElementById("player-count")
let lowPlayer = document.querySelector(".low-player");
let currPlayer = 0;
let revealBtn = document.querySelector("#reveal-btn");
let anmtPara = document.querySelector("#Anmt-para");
let participants;
const wordDisplay = document.getElementById("word-display");
let isWordVisible = false;
const finishBtn = document.querySelector("#finish-btn");




strtBtn.addEventListener("click", () => {
    strtBtn.classList.add("hide")
    playerConfirmation.classList.remove("hide")
})



confirmPlayerBtn.addEventListener("click", () => {
    if (playerInput.value < 3) {
        lowPlayer.classList.remove("hide")
    } else if (playerInput.value > 10) {
        lowPlayer.classList.remove("hide")
    } else {
        participants = Number(playerInput.value);
        console.log(participants, " players will play")

        lowPlayer.classList.add("hide")
    }
    imposterIndex = Math.floor(Math.random() * participants);



    // Transitioning to next screen.

    confirmPlayerBtn.classList.add("hide")
    anmtPara.classList.add("hide")
    playerInput.classList.add("hide")
    revealBtn.classList.remove("hide")
    wordDisplay.innerText = "pass the phone to player 1"

})



revealBtn.addEventListener("click", () => {
    if (currPlayer >= participants) {
        wordDisplay.innerText = "All participants know the word";

        return;
    }

    if (isWordVisible === false) {
        if (currPlayer === imposterIndex) {
            wordDisplay.innerText = imposterWord;
        } else {
            wordDisplay.innerText = mainWord;
        }
        isWordVisible = true;
    } else {

        currPlayer++;

        if (currPlayer >= participants) {
            wordDisplay.innerText = "All participants know the word";
            finishBtn.classList.remove("hide");
            revealBtn.classList.add("hide")
        } else {
            wordDisplay.innerText = "Pass phone to player : " + (currPlayer + 1);
        }

        isWordVisible = false;
    }
});


finishBtn.addEventListener("click", () => {
    wordDisplay.innerText = "Imposter is Player " + (imposterIndex + 1) + " and their word is " + imposterWord + "\n The main word is " + mainWord;
    finishBtn.classList.add("hide")
})



const wordPairs = [
    ["Dog", "Wolf"],
    ["Cat", "Tiger"],
    ["Lion", "Leopard"],
    ["Horse", "Donkey"],
    ["Cow", "Buffalo"],
    ["Goat", "Sheep"],
    ["Chicken", "Turkey"],
    ["Duck", "Goose"],
    ["Crow", "Raven"],
    ["Eagle", "Hawk"],
    ["Shark", "Dolphin"],
    ["Whale", "Shark"],
    ["Octopus", "Squid"],
    ["Crab", "Lobster"],
    ["Ant", "Termite"],
    ["Bee", "Wasp"],
    ["Butterfly", "Moth"],
    ["Spider", "Scorpion"],
    ["Snake", "Lizard"],
    ["Frog", "Toad"],
    ["Tree", "Bush"],
    ["Flower", "Plant"],
    ["Leaf", "Petal"],
    ["Grass", "Weed"],
    ["Forest", "Jungle"],
    ["Desert", "Dune"],
    ["Mountain", "Hill"],
    ["River", "Stream"],
    ["Ocean", "Sea"],
    ["Lake", "Pond"],
    ["Sun", "Star"],
    ["Moon", "Planet"],
    ["Comet", "Asteroid"],
    ["Galaxy", "Universe"],
    ["Cloud", "Fog"],
    ["Rain", "Drizzle"],
    ["Storm", "Hurricane"],
    ["Thunder", "Lightning"],
    ["Wind", "Breeze"],
    ["Snow", "Hail"],
    ["Fire", "Flame"],
    ["Smoke", "Ash"],
    ["Coal", "Charcoal"],
    ["Sand", "Dust"],
    ["Stone", "Rock"],
    ["Brick", "Tile"],
    ["Iron", "Steel"],
    ["Gold", "Silver"],
    ["Diamond", "Crystal"],
    ["Glass", "Mirror"],
    ["Chair", "Stool"],
    ["Table", "Desk"],
    ["Bed", "Couch"],
    ["Sofa", "Recliner"],
    ["Cup", "Mug"],
    ["Plate", "Dish"],
    ["Spoon", "Fork"],
    ["Knife", "Dagger"],
    ["Bottle", "Jar"],
    ["Bucket", "Barrel"],
    ["Door", "Gate"],
    ["Window", "Vent"],
    ["Roof", "Ceiling"],
    ["Floor", "Ground"],
    ["Wall", "Fence"],
    ["House", "Cabin"],
    ["Apartment", "Flat"],
    ["Palace", "Castle"],
    ["Temple", "Shrine"],
    ["School", "College"],
    ["Book", "Novel"],
    ["Magazine", "Newspaper"],
    ["Pen", "Pencil"],
    ["Marker", "Highlighter"],
    ["Paper", "Notebook"],
    ["Folder", "File"],
    ["Bag", "Backpack"],
    ["Suitcase", "Luggage"],
    ["Clock", "Watch"],
    ["Phone", "Tablet"],
    ["Laptop", "Computer"],
    ["Keyboard", "Typewriter"],
    ["Mouse", "Trackpad"],
    ["Camera", "Camcorder"],
    ["TV", "Monitor"],
    ["Speaker", "Headphone"],
    ["Radio", "Walkman"],
    ["Car", "Truck"],
    ["Bus", "Van"],
    ["Bike", "Motorcycle"],
    ["Train", "Subway"],
    ["Plane", "Jet"],
    ["Helicopter", "Drone"],
    ["Boat", "Ship"],
    ["Canoe", "Kayak"],
    ["Submarine", "Submersible"],
    ["Rocket", "Missile"],
    ["Doctor", "Nurse"],
    ["Teacher", "Professor"],
    ["Student", "Pupil"],
    ["Chef", "Cook"],
    ["Farmer", "Gardener"],
    ["Artist", "Painter"],
    ["Singer", "Musician"],
    ["Actor", "Performer"],
    ["Driver", "Pilot"],
    ["Police", "Detective"],
    ["Army", "Navy"],
    ["King", "Emperor"],
    ["Queen", "Princess"],
    ["Prince", "Duke"],
    ["Knight", "Warrior"],
    ["Thief", "Robber"],
    ["Judge", "Lawyer"],
    ["Priest", "Monk"],
    ["Scientist", "Researcher"],
    ["Engineer", "Mechanic"],
    ["Bread", "Toast"],
    ["Rice", "Wheat"],
    ["Pasta", "Noodles"],
    ["Soup", "Stew"],
    ["Cake", "Pastry"],
    ["Cookie", "Biscuit"],
    ["Chocolate", "Candy"],
    ["Milk", "Cream"],
    ["Butter", "Cheese"],
    ["Tea", "Coffee"],
    ["Juice", "Smoothie"],
    ["Soda", "Cola"],
    ["Beer", "Wine"],
    ["Salt", "Sugar"],
    ["Pepper", "Chili"],
    ["Apple", "Pear"],
    ["Peach", "Plum"],
    ["Mango", "Papaya"],
    ["Banana", "Plantain"],
    ["Orange", "Tangerine"],
    ["Lemon", "Lime"],
    ["Strawberry", "Cherry"],
    ["Grape", "Blueberry"],
    ["Potato", "Sweet Potato"],
    ["Onion", "Garlic"],
    ["Carrot", "Radish"],
    ["Cabbage", "Lettuce"],
    ["Spinach", "Kale"],
    ["Corn", "Peas"],
    ["Bean", "Lentil"]
];

randomIndex = Math.floor(Math.random() * wordPairs.length)

let selectedPair = wordPairs[randomIndex];
let mainWord = selectedPair[0];
let imposterWord = selectedPair[1];









