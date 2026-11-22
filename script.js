"use strict";

const API_URL = "https://media2.edu.metropolia.fi/restaurant/api/v1";

let allRestaurants = [];
let selectedRestaurant = null;
let favoriteRestaurants = JSON.parse(localStorage.getItem("favorites")) || [];
let showFavorites = false;

// Haetaan ravintolat REST APista
const getRestaurants = async () => {
  try {
    const response = await fetch(`${API_URL}/restaurants`);

    if (!response.ok) {
      throw new Error("Ravintoloiden hakeminen epäonnistui");
    }

    const data = await response.json();
    allRestaurants = data;
    populateCityFilter();
    populateCompanyFilter();
    showRestaurants(allRestaurants);
  } catch (error) {
    console.error("Virhe: ", error);
  }
};

// Näytetään ravintolat sivulla
const showRestaurants = (restaurants) => {
  const restaurantList = document.querySelector("#restaurant-list");
  restaurantList.innerHTML = "";

  restaurants.forEach((restaurant) => {
    const card = document.createElement("article");
    card.classList.add("restaurant-card");

    const name = document.createElement("h3");
    name.textContent = restaurant.name;

    const info = document.createElement("p");
    info.textContent = `${restaurant.city} - ${restaurant.company}`;

    // Suosikki -painike
    const favoriteButton = document.createElement("button");
    favoriteButton.classList.add("favorite-button");

    if (favoriteRestaurants.includes(restaurant._id)) {
      favoriteButton.textContent = "♥";
      favoriteButton.classList.add("is-favorite");
    } else {
      favoriteButton.textContent = "♡";
    }

    // Lisätään tai poistetaan suosikki klikkaamalla
    favoriteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFavorite(restaurant._id);
    });

    card.append(name, info, favoriteButton);

    card.addEventListener("click", () => {
      showRestaurantDetails(restaurant);
    });

    restaurantList.append(card);
  });
};

// Lisätään tai poistetaan ravintola suosikeista
const toggleFavorite = (restaurantId) => {
  if (favoriteRestaurants.includes(restaurantId)) {
    favoriteRestaurants = favoriteRestaurants.filter(
      (id) => id !== restaurantId,
    );
  } else {
    favoriteRestaurants.push(restaurantId);
  }

  localStorage.setItem("favorites", JSON.stringify(favoriteRestaurants));

  searchRestaurants();
};

// Klikatun ravintolan tiedot (pop-up ikkunua)
const showRestaurantDetails = (restaurant) => {
  selectedRestaurant = restaurant;

  const restaurantDialog = document.querySelector("#restaurant-dialog");

  const restaurantName = document.querySelector("#restaurant-name");
  const restaurantInfo = document.querySelector("#restaurant-info");
  const menuList = document.querySelector("#menu-list");

  restaurantName.textContent = restaurant.name;
  restaurantInfo.textContent = `${restaurant.city} - ${restaurant.company}`;

  menuList.innerHTML = "";

  restaurantDialog.showModal();
};

// Hae ravintolan ruokalistat
const getMenu = async (menuType) => {
  const menuList = document.querySelector("#menu-list");

  try {
    menuList.textContent = "Ruokalistaa ladataan...";

    const response = await fetch(
      `${API_URL}/restaurants/${menuType}/${selectedRestaurant._id}/fi`,
    );

    if (!response.ok) {
      throw new Error("Ruokalistan hakeminen epäonnistui");
    }
    const data = await response.json();

    menuList.innerHTML = "";

    if (menuType === "daily") {
      showCourses(data.courses, menuList);
    } else {
      showWeeklyMenu(data.days, menuList);
    }
  } catch (error) {
    console.log("Virhe:", error);
    menuList.textContent = "Ruokalistan hakeminen epäonnistunut.";
  }
};

// Näytetään päivän ruokalistan menuu
const showCourses = (courses, container) => {
  if (!courses || courses.length === 0) {
    container.textContent = "Ruokalistaa ei ole saatavilla.";
    return;
  }

  courses.forEach((course) => {
    const courseItem = document.createElement("div");
    courseItem.classList.add("course-item");

    const name = document.createElement("h4");
    name.textContent = course.name;

    const price = document.createElement("p");
    price.textContent = course.price;

    const diets = document.createElement("p");
    diets.textContent = course.diets;

    courseItem.append(name, price, diets);
    container.append(courseItem);
  });
};

// Näytetään viikon ruokalista päivä kerralla
const showWeeklyMenu = (days, container) => {
  if (!days || days.length === 0) {
    container.textContent = "Ruokalistaa ei ole saatavilla.";
    return;
  }

  days.forEach((day) => {
    const daySection = document.createElement("section");
    daySection.classList.add("menu-day");

    const date = document.createElement("h3");
    date.textContent = day.date;

    daySection.append(date);

    showCourses(day.courses, daySection);

    container.append(daySection);
  });
};

// Filteröi ravintolat hakusanan, kaupungin, palvelutarjoajan tai suosikkien mukaan
const searchRestaurants = () => {
  const searchInput = document.querySelector("#search-input");
  const searchText = searchInput.value.toLowerCase();

  const cityFilter = document.querySelector("#city-filter");
  const selectedCity = cityFilter.value;

  const companyFilter = document.querySelector("#company-filter");
  const selectedCompany = companyFilter.value;

  const filterRestaurants = allRestaurants.filter((restaurant) => {
    const matchSearch =
      restaurant.name.toLowerCase().includes(searchText) ||
      restaurant.city.toLowerCase().includes(searchText);

    const matchCity = selectedCity === "" || restaurant.city === selectedCity;

    const matchFavorite =
      !showFavorites || favoriteRestaurants.includes(restaurant._id);

    const matchCompany =
      selectedCompany === "" || restaurant.company === selectedCompany;

    return matchSearch && matchCity && matchCompany && matchFavorite;
  });
  showRestaurants(filterRestaurants);
};

// Lisätään APIsta saadut kaupungit valintalistaan
const populateCityFilter = () => {
  const citySelect = document.querySelector("#city-filter");
  const cities = [];

  allRestaurants.forEach((restaurant) => {
    if (!cities.includes(restaurant.city)) {
      cities.push(restaurant.city);
    }
  });

  cities.sort();

  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;

    citySelect.append(option);
  });
};

// Lisätään APIsta saadut palveluntarjoajat valintalistaan
const populateCompanyFilter = () => {
  const companySelect = document.querySelector("#company-filter");
  const companies = [];

  allRestaurants.forEach((restaurant) => {
    if (!companies.includes(restaurant.company)) {
      companies.push(restaurant.company);
    }
  });

  companies.sort();

  companies.forEach((company) => {
    const option = document.createElement("option");
    option.value = company;
    option.textContent = company;

    companySelect.append(option);
  });
};

// Tapahtumakuuntelijat:
// Päivitetään ravintolat hakukentän kirjoituksen mukaan
const searchInput = document.querySelector("#search-input");
searchInput.addEventListener("input", searchRestaurants);

// Päivitetään ravintolat kaupungin valinnan mukaan
const cityFilter = document.querySelector("#city-filter");
cityFilter.addEventListener("change", searchRestaurants);

// Päivitetään ravintolat palveluntarjoajan mukaan
const companyFilter = document.querySelector("#company-filter");
companyFilter.addEventListener("change", searchRestaurants);

// Näytetään kaikki ravintolat
const allRestaurantsButton = document.querySelector("#all-restaurants-button");

allRestaurantsButton.addEventListener("click", () => {
  showFavorites = false;
  searchRestaurants();
});

// Näytetään vain suosikit
const favoritesButton = document.querySelector("#favorites-button");

favoritesButton.addEventListener("click", () => {
  showFavorites = true;
  searchRestaurants();
});

// Päivän ruokalistan painike
const dailyMenuButton = document.querySelector("#daily-menu-button");

dailyMenuButton.addEventListener("click", () => {
  getMenu("daily");
});

// Viikon ruokalistan painike
const weeklyMenuButton = document.querySelector("#weekly-menu-button");

weeklyMenuButton.addEventListener("click", () => {
  getMenu("weekly");
});

// Suljetaan pop-up
const closeButton = document.querySelector("#close-dialog");

closeButton.addEventListener("click", () => {
  const restaurantDialog = document.querySelector("#restaurant-dialog");
  restaurantDialog.close();
});

// Kirjautumisikkunan elementit
const authDialog = document.querySelector("#auth-dialog");
const loginButton = document.querySelector("#login-button");
const closeAuthDialog = document.querySelector("#close-auth-dialog");
const userStatus = document.querySelector("#user-status");
const logoutButton = document.querySelector("#logout-button");

const loginSection = document.querySelector("#login-section");
const registerSection = document.querySelector("#register-section");

const showRegisterButton = document.querySelector("#show-register");
const showLoginButton = document.querySelector("#show-login");

const authMessage = document.querySelector("#auth-message");

// Omat tiedot -ikkunan elementit
const profileDialog = document.querySelector("#profile-dialog");
const profileUsername = document.querySelector("#profile-username");
const profileEmail = document.querySelector("#profile-email");
const profileForm = document.querySelector("#profile-form");
const profileMessage = document.querySelector("#profile-message");
const closeProfileDialog = document.querySelector("#close-profile-dialog");

let currentUser = null;

// Avaa kirjautuminen ja sulkeminen
loginButton.addEventListener("click", () => {
  authDialog.showModal();
});
closeAuthDialog.addEventListener("click", () => {
  authDialog.close();
});

// Kirjauutmisesta rekisteröitymiseen
showRegisterButton.addEventListener("click", () => {
  loginSection.hidden = true;
  registerSection.hidden = false;
  authMessage.textContent = "";
});

// Rekisteröitymislomake
const registerForm = document.querySelector("#register-form");

// Kirjautumislomake
const loginForm = document.querySelector("#login-form");

// Kirjautuminen
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Haetaan lomakkeen tiedot
  const username = document.querySelector("#login-username").value;
  const password = document.querySelector("#login-password").value;

  try {
    authMessage.textContent = "Kirjaudutaan sisään...";

    // Lähetetään kirjautumistiedot APIlle
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.token) {
      throw new Error(data.message || "Kirjautuminen epäonnistui.");
    }

    // Tallennetaan kirjautumistoken!
    localStorage.setItem("token", data.token);
    currentUser = data.data;
    updateAuthUI(data.data.username);

    authDialog.close();
    loginForm.reset();
  } catch (error) {
    console.error("Kirjautumisvirhe:", error);
    authMessage.textContent = error.message;
  }
});

// Rekisteröityminen
registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Haetaan lomakkeen tiedot
  const username = document.querySelector("#register-username").value;
  const email = document.querySelector("#register-email").value;
  const password = document.querySelector("#register-password").value;

  try {
    authMessage.textContent = "Tarkistetaan käyttäjänimeä...";

    // Tarkistetaan, onko käyttäjänimi vapaa
    const checkResponse = await fetch(
      `${API_URL}/users/available/${encodeURIComponent(username)}`,
    );

    if (!checkResponse.ok) {
      throw new Error("Käyttäjänimen tarkistaminen epäonnistui.");
    }

    const checkData = await checkResponse.json();

    if (!checkData.available) {
      authMessage.textContent = "Käyttäjänimi on jo käytössä.";
      return;
    }

    // Lähetetään rekisteröitymistiedot APIlle
    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.data) {
      throw new Error(data.message || "Rekisteröityminen epäonnistui.");
    }

    authMessage.textContent = data.message || "Rekisteröityminen onnistui!";

    registerForm.reset();
  } catch (error) {
    console.error("Rekisteröitymisvirhe:", error);
    authMessage.textContent = error.message;
  }
});

// Vaihdetaan rekisteröitymisestä kirjautumiseen
showLoginButton.addEventListener("click", () => {
  registerSection.hidden = true;
  loginSection.hidden = false;
  authMessage.textContent = "";
});

// Päivitetään kirjautumistiedot
const updateAuthUI = (username) => {
  userStatus.textContent = `Kirjautunut: ${username}`;

  userStatus.hidden = false;
  loginButton.hidden = true;
  logoutButton.hidden = false;
};

// Avataan omat tiedot
userStatus.addEventListener("click", () => {
  if (!currentUser) {
    return;
  }

  profileUsername.textContent = `Käyttäjänimi: ${currentUser.username}`;
  profileEmail.value = currentUser.email || "";

  profileMessage.textContent = "";

  profileDialog.showModal();
});

// Suljetaan omat tiedot
closeProfileDialog.addEventListener("click", () => {
  profileDialog.close();
});

// Tallennetaan sähköpostin muutokset
profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const token = localStorage.getItem("token");
  const newEmail = profileEmail.value.trim();

  try {
    const response = await fetch(`${API_URL}/users`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: newEmail,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Sähköpostin päivittäminen epäonnistui.");
    }

    currentUser.email = newEmail;
    profileMessage.textContent = "Sähköposti päivitetty onnistuneesti!";
  } catch (error) {
    console.error("Sähköpostin päivittäminen epäonnistui:", error);
    profileMessage.textContent = error.message;
  }
});

// Onko käyttäjä kirjautunut sisään
const checkLoginStatus = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    userStatus.hidden = true;
    loginButton.hidden = false;
    logoutButton.hidden = true;
    return;
  }

  try {
    const response = await fetch(`${API_URL}/users/token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Kirjautuminen ei ole enää voimassa.");
    }

    const data = await response.json();
    const user = data.data || data;

    currentUser = user;
    updateAuthUI(user.username);
  } catch (error) {
    console.error("Kirjautumistilan tarkistaminen epäonnistui:", error);

    localStorage.removeItem("token");
  }
};

// Kirjaudu ulos
logoutButton.addEventListener("click", () => {
  localStorage.removeItem("token");

  currentUser = null;

  userStatus.hidden = true;
  loginButton.hidden = false;
  logoutButton.hidden = true;
});

// Tarkistetaan kirjautumistila sivun latautuessa
checkLoginStatus();

getRestaurants();
