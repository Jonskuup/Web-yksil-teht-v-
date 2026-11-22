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

getRestaurants();
