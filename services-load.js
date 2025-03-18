window.addEventListener("load", function () {
	$.noConflict();
	const dropdownKeys = [
		{ key: "catWho", selector: ".who-has-died select" },
		{ key: "catCDeath", selector: ".circumstances-death select" },
		{ key: "catAgePerson", selector: ".age-person-needing-support select" },
		{ key: "catType", selector: ".type-support select" },
		{ key: "catLocation", selector: ".location select" },
	];

	const regionalSection = document.querySelector(".regional-section-wrapper");
	const nationalSection = document.querySelector(".national-section-wrapper");
	const featuredSection = document.querySelector(".featured-section-wrapper");
	const loadingScreen = document.getElementById("loading-screen");

	let jsonData = [];
	let filteredData = [];
	let displayedData = [];
	let wholeCategories = {};
	let catWho = [];
	let whoCat = [];
	let catCDeath = [];
	let cDeathCat = [];
	let catAgePerson = [];
	let agePersonCat = [];
	let catLocation = [];
	let locationCat = [];
	let catType = [];
	let typeCat = [];
	const cacheDurationHours = 1;
	const itemsPerLoad = 100; // Number of items to load initially and for each "Load More"
	const BASE_URL = window.location.origin;
	const jsonPath = BASE_URL + "/more-info/bereavement-services?format=json";
	// const jsonPath = "/bereavement-services-large.json";
	const totalResultsElement = document.querySelector(".total-results span");
	let itemCategories = [];

	/**
	 * Fetch paginated data with caching logic using human-readable expiration.
	 *
	 * @param {string} initialUrl - The first URL to fetch.
	 * @param {Array} accumulatedData - An array to store the fetched data.
	 * @param {number} cacheDurationHours - Cache expiration duration in hours.
	 * @returns {Promise<Array>} - A promise resolving to the complete accumulated data.
	 */
	async function fetchPaginatedData(
		initialUrl,
		accumulatedData = [],
		cacheDurationHours = 1
	) {
		const CACHE_KEY = "originalDataCache"; // Key for localStorage
		const CACHE_EXPIRATION_KEY = "originalDataCacheExpiration"; // Key for expiration
		const now = new Date(); // Current date and time

		// Check if cached data exists and is still valid
		const cachedData = localStorage.getItem(CACHE_KEY);
		const cacheExpiration = localStorage.getItem(CACHE_EXPIRATION_KEY);

		if (cachedData && cacheExpiration) {
			const expirationDate = new Date(cacheExpiration);

			if (now < expirationDate) {
				try {
					console.log("Using cached data items - " + CACHE_KEY);

					// Parse cached data and verify it's not corrupted
					const parsedData = JSON.parse(cachedData);
					if (Array.isArray(parsedData) && parsedData.length > 0) {
						return parsedData;
					} else {
						console.warn(
							"Cached data is empty or invalid. Fetching fresh data..."
						);
					}
				} catch (error) {
					console.warn(
						"Failed to parse cached data. Fetching fresh data...",
						error
					);
				}
			} else {
				console.log("Cache expired. Fetching fresh data...");
			}
		}

		try {
			// Fetch the JSON data from the current page
			const response = await fetch(initialUrl);
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			// Parse the JSON response
			const data = await response.json();

			// Accumulate the results
			if (data.items && data.items.length > 0) {
				accumulatedData.push(...data.items);
			}

			// Check for the next page URL and fetch recursively if available
			if (data.pagination && data.pagination.nextPageUrl) {
				console.log(
					`Fetching fresh next page: ${data.pagination.nextPageUrl}`
				);
				return fetchPaginatedData(
					BASE_URL + data.pagination.nextPageUrl + "&format=json",
					accumulatedData,
					cacheDurationHours
				);
			}

			// Cache the accumulated data
			//localStorage.setItem(CACHE_KEY, JSON.stringify(accumulatedData));
			const expirationDate = new Date();
			expirationDate.setHours(expirationDate.getHours() + cacheDurationHours); // Add hours to current time
			//localStorage.setItem(
			//	CACHE_EXPIRATION_KEY,
			//	expirationDate.toISOString()
			//); // Store human-readable expiration date

			console.log(
				"Data fetched and NOT (johne) cached successfully until:",
				expirationDate.toISOString()
			);
			return accumulatedData; // Return the complete accumulated data
		} catch (error) {
			console.error("Error fetching data:", error);

			// Return the accumulated data so far (even if incomplete)
			return accumulatedData;
		}
	}

	async function fetchData() {
		try {
			// Show the loading screen
			loadingScreen.classList.remove("loading-hidden");
			loadingScreen.classList.add("loading-visible");

			// Wait for all paginated data to be fetched
			const allData = await fetchPaginatedData(
				jsonPath,
				[],
				cacheDurationHours
			);
			//console.log("All data fetched:", allData);
			// Process the fetched data
			window.originalData = allData;

			window.originalData.forEach((item) => {
				if (item.categories) {
					itemCategories.push(...item.categories);
				}
				catWho = extractedData("Who:", item.categories).sort();
				catCDeath = extractedData("Cir:", item.categories).sort();
				catAgePerson = extractedData("Age:", item.categories).sort();
				catLocation = extractedData("Location:", item.categories).sort();
				catType = extractedData("Type:", item.categories).sort();
				requiredData = [
					{
						displayIndex: item.displayIndex,
						title: item.title,
						body: item.body,
						excerpt: item.excerpt,
						featured: item.starred,
						catWho: catWho,
						catCDeath: catCDeath,
						catAgePerson: catAgePerson,
						catLocation: catLocation,
						catType: catType,
					},
				];

				// Push the data into new array for dropdowns and after extraction
				// Sort jsonData by title in ascending order
				jsonData.push(...requiredData);
				jsonData.sort((a, b) => a.title.localeCompare(b.title));
				whoCat = [...new Set([...whoCat, ...catWho])].sort();
				cDeathCat = [...new Set([...cDeathCat, ...catCDeath])].sort();
				agePersonCat = [
					...new Set([...agePersonCat, ...catAgePerson]),
				].sort();
				locationCat = [...new Set([...locationCat, ...catLocation])].sort();
				typeCat = [...new Set([...typeCat, ...catType])].sort();
			});
			filteredData = jsonData;
			wholeCategories = {
				catWho: whoCat,
				catCDeath: cDeathCat,
				catAgePerson: agePersonCat,
				catLocation: locationCat,
				catType: typeCat,
			};

			dropdownKeys.forEach((item) => {
				populateDropdown(
					document.querySelector(item.selector),
					wholeCategories[item.key]
				);
				setMultiSelectValuesFromUrl();
				initializeMultiselect(document.querySelector(item.selector));
			});

			// Initially display results
			displayedData = filteredData.slice(0, itemsPerLoad);
			displayResults(displayedData);
			updateLoadMoreButton();
			updateDropdownActiveStates();
			updateTotalResults(filteredData.length);
		} catch (error) {
			console.error("Error in fetching data:", error);
		} finally {
			// Hide the loading screen
			const loadingScreen = document.getElementById("loading-screen");
			loadingScreen.classList.remove("loading-visible");
			loadingScreen.classList.add("loading-hidden");
		}
	}

	function extractedData(delimiter, dataArrays) {
		const combinedData = [];
		// Iterate through each entry in the data array
		dataArrays.forEach((data) => {
			if (
				data.includes(delimiter) &&
				data.split(delimiter)[1].trim() !== ""
			) {
				combinedData.push(data.split(delimiter)[1].trim());
			}
		});
		// Remove duplicates using a Set
		return [...new Set(combinedData)];
	}

	function populateDropdown(element, options) {
		try {
			if (!element) throw new Error("Dropdown element not found");

			// Reset dropdown
			element.innerHTML = "";

			// Special handling for Location dropdown
			if (element.id === "catLocation") {
				// Remove National organisation from dropdown
				const sortedOptions = options.filter(
					(option) => option.trim().toLowerCase() !== "national organisations"
				);
				// Add the rest of the sorted options
				sortedOptions.forEach((option) => {
					const optionElement = document.createElement("option");
					optionElement.value = option;
					optionElement.textContent = option;
					element.appendChild(optionElement);
				});
			} else {
				// For other dropdowns, sort options alphabetically
				options.sort().forEach((option) => {
					const optionElement = document.createElement("option");
					optionElement.value = option;
					optionElement.textContent = option;
					element.appendChild(optionElement);
				});
			}
		} catch (error) {
			console.error("Error populating dropdown:", error);
			showError("Error populating dropdown, please check the data.");
		}
	}

	// Add this function near the top with other initializations
	function updateDropdownActiveStates() {
		const dropdowns = document.querySelectorAll("select.filter-dropdown");
		const contentElement = document.querySelector(
			".content-results-mobile-desktop"
		);
		const hasSelection = Array.from(dropdowns).some((dropdown) => {
			// if (dropdown.id === 'catLocation') return false; // Exclude Location dropdown

			const selectedValues = Array.from(dropdown.selectedOptions).map(
				(option) => option.value
			);
			return selectedValues.length > 0 && !selectedValues.includes("--");
		});
		contentElement.classList.toggle("filters-activated", hasSelection);
	}

	function initializeMultiselect(element) {
		$(element).selectpicker("refresh");
		$(element).selectpicker({
			noneSelectedText: "Select options",
			liveSearch: true,
			actionsBox: true,
			selectAllText: "Select All",
			deselectAllText: "Deselect All",
		});
	}

	function displayResults(data, filtered = false) {
		regionalSection.innerHTML = "";
		nationalSection.innerHTML = "";
		featuredSection.innerHTML = "";

		// if (data.length === 0) {
		//   regionalSection.innerHTML = '<div class="no-results">No results found</div>';
		//   return;
		// }
		// Iterate through filtered data and append to respective sections
		nationalCards = "";
		regionalCards = "";
		data.forEach((item) => {
			const card = `
			 <div class="card border border-bottom-0 flex-fill h-100">
				 <div class="card-body p-4">
					 <h5 class="card-title fw-bold">${item.title}</h5>
					 <div class='card-text-description'>
						 <p class="card-text">${stripHtmlAndLimit(item.excerpt, 500) || ""
				}</p>
					 </div>
					 <button
						 class="btn read-more mt-3 btn-outline-secondary"
						 data-bs-toggle="modal"
						 data-id="${item.displayIndex}"
						 data-bs-target="#descriptionModal"
						 data-content="${"No description available."}">
						 Read More
					 </button>
					 <div class='card-description-hidden d-none' id="cardDescription"><p>No description available.</p></div>
				 </div>
			 </div>
	 `;

			if (item.featured) {
				featuredSection.innerHTML += card;
			}

			/*if (filtered == true) {
		 if (item.catLocation.includes('NATIONAL ORGANISATIONS', 'National Organisations', 'national organisations')) {
			 nationalSection.innerHTML += card;
		 } else {
			 regionalSection.innerHTML += card;
		 }
	 }*/
			if (
				item.catLocation.includes(
					"NATIONAL ORGANISATIONS",
					"National Organisations",
					"national organisations"
				)
			) {
				nationalCards += card;
			} else {
				regionalCards += card;
			}
		});
		nationalSection.innerHTML += nationalCards;
		regionalSection.innerHTML += regionalCards;
	}

	function stripHtmlAndLimit(text, limit) {
		// Create a temporary DOM element to strip HTML tags
		const tempDiv = document.createElement("div");
		tempDiv.innerHTML = text;
		const plainTextNonTrimmed =
			tempDiv.textContent || tempDiv.innerText || "";
		const plainText = plainTextNonTrimmed.trim();
		// Check if the text needs truncation
		if (plainText.length > limit) {
			// Find the last space within the limit to avoid cutting a word
			let truncatedText = plainText.substring(0, limit);
			const lastSpaceIndex = truncatedText.lastIndexOf(" ");
			if (lastSpaceIndex > -1) {
				truncatedText = truncatedText.substring(0, lastSpaceIndex);
			}
			return truncatedText + " ...";
		}
		return plainText;
	}

	function updateTotalResults(count) {
		totalResultsElement.textContent = count;
		if (count === 0)
			document
				.querySelector(".no-results-wrapper")
				.classList.toggle("d-none");
	}

	function throttle(func, limit) {
		let lastFunc;
		let lastRan;
		return function () {
			const context = this, args = arguments;
			if (!lastRan) {
				func.apply(context, args);
				lastRan = Date.now();
			} else {
				clearTimeout(lastFunc);
				lastFunc = setTimeout(function () {
					if ((Date.now() - lastRan) >= limit) {
						func.apply(context, args);
						lastRan = Date.now();
					}
				}, limit - (Date.now() - lastRan));
			}
		};
	}

	function updateLoadMoreButton() {
		/*const loadMoreButton = document.getElementById('load-more');
 if (displayedData.length >= filteredData.length) {
	 loadMoreButton.style.display = 'none';
 } else {
	 loadMoreButton.style.display = 'block';
 }*/
	}

	/*document.getElementById('load-more').addEventListener('click', () => {
 const startIndex = displayedData.length;
 const nextBatch = filteredData.slice(startIndex, startIndex + itemsPerLoad);
 displayedData = [...displayedData, ...nextBatch];
 displayResults(displayedData);
 updateLoadMoreButton();
 updateTotalResults(filteredData.length);
});*/

	document
		.querySelectorAll(
			".regional-section-wrapper, .national-section-wrapper, .featured-section-wrapper"
		)
		.forEach((section) => {
			section.addEventListener("scroll", throttle(async function () {
				const scrollTop = this.scrollTop;
				const scrollHeight = this.scrollHeight;
				const clientHeight = this.clientHeight;

				if (scrollTop + clientHeight >= scrollHeight - 10) {
					// Show the loading screen
					loadingScreen.classList.remove("loading-hidden");
					loadingScreen.classList.add("loading-visible");

					// Simulate loading delay (optional, adjust as needed)
					await new Promise(resolve => setTimeout(resolve, 500));
					// Load more data
					const startIndex = displayedData.length;
					const nextBatch = filteredData.slice(startIndex, startIndex + itemsPerLoad);
					displayedData = [...displayedData, ...nextBatch];

					// Update UI
					displayResults(displayedData, true);
					updateLoadMoreButton();
					updateTotalResults(filteredData.length);

					// Hide the loading screen after data is loaded
					loadingScreen.classList.remove("loading-visible");
					loadingScreen.classList.add("loading-hidden");
				}
			}, 200)); // Throttling to run every 200ms
		});

	document.getElementById("clear-filters").addEventListener("click", () => {
		dropdownKeys.forEach(({ selector }) => {
			const dropdownElement = document.querySelector(selector);
			$(dropdownElement).selectpicker("deselectAll");
			$(dropdownElement).selectpicker("refresh");
		});

		// Remove filters from the URL
		history.replaceState(null, "", window.location.pathname);

		filteredData = jsonData;
		displayedData = filteredData.slice(0, itemsPerLoad);
		displayResults(displayedData);
		updateLoadMoreButton();
		updateDropdownActiveStates();
		updateTotalResults(filteredData.length);
	});

	dropdownKeys.forEach(({ selector }) => {
		// $(document.querySelector(selector)).on('change', filterResults);
		document
			.querySelector(selector)
			.addEventListener("change", filterResults);
	});

	function filterResults() {
		try {
			const filters = {};
			dropdownKeys.forEach(({ key, selector }) => {
				const selectedValues = getSelectedValues(selector);
				if (selectedValues !== null) filters[key] = selectedValues;
			});

			filteredData = jsonData.filter((item) => {
				return Object.entries(filters).every(([key, values]) => {
					let categoryArray = Array.isArray(item[key])
						? item[key]
						: item[key]
							? [item[key]]
							: [];
					return values.some((value) =>
						categoryArray.some(
							(cat) => cat.trim().toLowerCase() === value.trim().toLowerCase()
						)
					);
				});
			});

			displayedData = filteredData.slice(0, itemsPerLoad);
			// console.log(filteredData)
			displayResults(displayedData, true);
			updateLoadMoreButton();
			updateDropdownActiveStates();
			updateTotalResults(filteredData.length);
		} catch (error) {
			console.error("Error filtering results:", error);
			showError("Error filtering results, please try again.");
		}
	}

	function getSelectedValues(selector) {
		const selectedOptions = Array.from(
			document.querySelector(selector).selectedOptions
		);
		const values = selectedOptions.map((option) => option.value);
		return values.length === 0 || values.includes("--") ? null : values;
	}

	/**
	 * Get URL parameters as an object.
	 * Ex: ?catWho=Baby,Adult child&catCDeath=Accident,Cancer&catAgePerson=18-30,30-50&catLocation=Angus,Belfast&catType=Helplines,Peer Support
	 * For multi-select, split comma-separated values into arrays.
	 * @returns {Object} Key-value pairs of URL parameters.
	 */
	function getUrlParams() {
		const params = new URLSearchParams(window.location.search);
		const result = {};
		params.forEach((value, key) => {
			// Split comma-separated values into an array
			result[key] = value.includes(",") ? value.split(",") : [value];
		});
		return result;
	}

	/**
	 * Clearing cache based on URL parameters.
	 */

	function clearCache() {
		localStorage.removeItem(CACHE_KEY);
		localStorage.removeItem(CACHE_EXPIRATION_KEY);
		console.log("Cache cleared!");
	}

	/**
	 * Pre-select multi-select dropdown values based on URL parameters.
	 */
	function setMultiSelectValuesFromUrl() {
		const params = getUrlParams();

		Object.keys(params).forEach((key) => {
			const dropdown = document.getElementById(key); // Match dropdown by ID
			if (dropdown && dropdown.tagName === "SELECT" && dropdown.multiple) {
				const values = params[key]; // Get array of values
				Array.from(dropdown.options).forEach((option) => {
					// Set the option as selected if it matches one of the values
					option.selected = values.includes(option.value);
				});
			}
		});

		filterResults();
	}

	fetchData();
});