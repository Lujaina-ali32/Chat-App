import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  signInWithPopup, GoogleAuthProvider, signOut 
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { 
  getDatabase, ref, push, onChildAdded, onChildChanged, onChildRemoved, remove, update, set, onValue
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";


const firebaseConfig = {
  apiKey: "AIzaSyAQsdKOlG6fcFAw1UxXA4qBSL3_OrjUCEI",
  authDomain: "real-time-database-4c3c2.firebaseapp.com",
  projectId: "real-time-database-4c3c2",
  storageBucket: "real-time-database-4c3c2.appspot.com",
  messagingSenderId: "811874664813",
  appId: "1:811874664813:web:d2a13dd8b1da9820845a64",
  measurementId: "G-0JVNLEQ75D"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getDatabase(app);






document.getElementById("signup")?.addEventListener("click", () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      Swal.fire({
        icon: "success",
        title: "Sign Up Successful!",
        showConfirmButton: false,
        timer: 1500
      });
      setTimeout(() => (window.location.href = "user.html"), 1600);
    })
    .catch(error => {
      Swal.fire("Error", error.message, "error");
    });
});


document.getElementById("login")?.addEventListener("click", () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      Swal.fire({
        icon: "success",
        title: "Login Successful!",
        showConfirmButton: false,
        timer: 1500
      });
      setTimeout(() => (window.location.href = "user.html"), 1600);
    })
    .catch(error => Swal.fire("Error", error.message, "error"));
});


document.getElementById("google-btn")?.addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then(result => {
      const user = result.user;
      localStorage.setItem("username", user.displayName || "User");
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userPhoto", user.photoURL || ""); 
      Swal.fire({
        icon: "success",
        title: `Welcome ${user.displayName || "User"}!`,
        showConfirmButton: false,
        timer: 1500
      });
      setTimeout(() => (window.location.href = "chat.html"), 1600);
    })
    .catch(error => Swal.fire("Error", "Google Login Failed: " + error.message, "error"));
});


document.getElementById("logout-btn")?.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      Swal.fire({
        icon: "success",
        title: "Logged Out Successfully",
        showConfirmButton: false,
        timer: 1500
      });
      setTimeout(() => (window.location.href = "index.html"), 1600);
    })
    .catch(error => Swal.fire("Error", error.message, "error"));
});


document.getElementById("user-btn")?.addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  if (!username) {
    Swal.fire("Oops!", "Please enter your name first!", "warning");
    return;
  }
  localStorage.setItem("username", username);
  localStorage.setItem("userPhoto", ""); 
  window.location.href = "chat.html";
});


window.onload = function() {
  const username = localStorage.getItem("username");
  if (!username && window.location.pathname.includes("chat.html")) {
    Swal.fire({
      icon: "info",
      title: "Please enter your name first!",
      confirmButtonText: "OK"
    }).then(() => {
      window.location.href = "user.html";
    });
  }
};


function sendMessageFunc() {
  const messageInput = document.getElementById("message");
  const message = messageInput.value.trim();
  if (!message) return;

  const name = localStorage.getItem("username") || "Anonymous";
  const userEmail = localStorage.getItem("userEmail") || "noemail";
  const userPhoto = localStorage.getItem("userPhoto") || "";

  push(ref(db, "messages"), {
    name,
    text: message,
    userEmail,
    userPhoto,
    timestamp: Date.now(),
    edited: false
  });

  messageInput.value = "";
}


document.getElementById("message")?.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessageFunc();
});
window.sendMessage = sendMessageFunc;


const typingRef = ref(db, "typing");
const username = localStorage.getItem("username");

document.getElementById("message")?.addEventListener("input", () => {
  set(ref(db, `typing/${username}`), true);
  setTimeout(() => set(ref(db, `typing/${username}`), false), 2000);
});


onValue(typingRef, snapshot => {
  const typingDiv = document.getElementById("typing-indicator");
  const typingUsers = [];
  snapshot.forEach(child => { if(child.val() && child.key !== username) typingUsers.push(child.key); });
  typingDiv.textContent = typingUsers.length ?`${typingUsers.join(", ")} is typing...` : "";
});


onChildAdded(ref(db, "messages"), snapshot => renderMessage(snapshot.val(), snapshot.key));
onChildChanged(ref(db, "messages"), snapshot => renderMessage(snapshot.val(), snapshot.key, true));
onChildRemoved(ref(db, "messages"), snapshot => {
  const card = document.getElementById(snapshot.key);
  if (card) card.remove();
});


function renderMessage(data, messageId, isUpdate=false) {
  const messageBox = document.getElementById("messages");
  const currentUser = localStorage.getItem("userEmail") || "noemail";
  const isUserMessage = data.userEmail === currentUser;

  let card = document.getElementById(messageId);
  if (!card) {
    card = document.createElement("div");
    card.id = messageId;
    card.classList.add("message-card");
    card.style.cssText = `
      display:flex;flex-direction:column;max-width:70%;
      align-self:${isUserMessage?'flex-end':'flex-start'};
      margin:8px;padding:10px;border-radius:12px;
      transition:0.3s;word-wrap:break-word;
      background:${isUserMessage?'#4a6b38':'#3c3a36'};color:#fff;position:relative;
    `;
    messageBox.appendChild(card);
  }

  const profilePicHTML = data.userPhoto && data.userPhoto.trim() !== "" 
    ? `<img src="${data.userPhoto}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">`
    : `<div style="width:32px;height:32px;border-radius:50%;
         background:#1e6091;display:flex;align-items:center;
         justify-content:center;color:#fff;font-weight:bold;font-size:16px;">
         ${data.name.charAt(0).toUpperCase()}
       </div>`;

  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;">
      ${profilePicHTML}
      <strong>${data.name}</strong>
      <span style="font-size:0.7rem;color:#ccc;margin-left:auto;">
        ${formatTime(data.timestamp)} ${data.edited?'(edited)':''}
      </span>
    </div>
    <p style="margin:6px 0;font-size:0.95rem;">${data.text}</p>
    <div class="msg-btns" style="display:none;gap:6px;position:absolute;top:4px;right:4px;"></div>
  `;

  if(isUserMessage){
    const btnContainer = card.querySelector(".msg-btns");

 
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏";
    editBtn.style.cssText = "background:#1e6091;color:white;border:none;padding:4px 6px;border-radius:4px;cursor:pointer;font-size:0.8rem;";
    editBtn.addEventListener("click", async () => {
      const { value: newText } = await Swal.fire({
        title: "Edit your message",
        input: "text",
        inputValue: data.text,
        showCancelButton: true,
        confirmButtonText: "Save",
        cancelButtonText: "Cancel"
      });
      if (newText && newText.trim()) {
        update(ref(db, "messages/"+messageId), {text:newText, edited:true});
      }
    });


    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑";
    delBtn.style.cssText = "background:#d62828;color:white;border:none;padding:4px 6px;border-radius:4px;cursor:pointer;font-size:0.8rem;";
    delBtn.addEventListener("click", () => {
      Swal.fire({
        title: "Are you sure?",
        text: "This message will be deleted permanently!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!"
      }).then(result => {
        if (result.isConfirmed) remove(ref(db,"messages/"+messageId));
      });
    });

    btnContainer.appendChild(editBtn);
    btnContainer.appendChild(delBtn);
    card.addEventListener("mouseenter", () => btnContainer.style.display="flex");
    card.addEventListener("mouseleave", () => btnContainer.style.display="none");
  }

  setTimeout(()=>messageBox.scrollTop=messageBox.scrollHeight,100);
}


function formatTime(ts){
  const date = new Date(ts);
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2,'0');
  const ampm = hours>=12?'PM':'AM';
  hours = hours%12||12;
  return `${hours}:${minutes} ${ampm}`;
}