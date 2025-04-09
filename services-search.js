window.addEventListener("load", function () {
	$.noConflict();
	const dropdownKeys = [
		{ key: "catWho", selector: ".who-has-died select" },
		{ key: "catCDeath", selector: ".circumstances-death select" },
		{ key: "catAgePerson", selector: ".age-person-needing-support select" },
		{ key: "catType", selector: ".type-support select" },
		{ key: "catLocation", selector: ".location select" },
	];
	
	const sections = [ 'regional', 'national', 'featured' ];

	const screenSections = [];
	const filteredData = [];
	const displayedData = [];
	const totalResultsElement = [];
	sections.forEach((section) => {
		screenSections[section] = document.querySelector(`.${section}-section-wrapper`);
		filteredData[section] = [];
		displayedData[section] = [];
		totalResultsElement[section] = document.querySelector(`.${section}-count span`);
	});
	
	const loadingScreen = document.getElementById("loading-screen");

	const itemsPerLoad = 30; // Number of items to load initially and for each "Load More"


	function initialise() {

		// Show the loading screen
		loadingScreen.classList.remove("loading-hidden");
		loadingScreen.classList.add("loading-visible");

		dropdownKeys.forEach((item) => {
			populateDropdown(
				document.querySelector(item.selector),
				window.wholeCategories[item.key]
			);
			initializeSingleSelect(document.querySelector(item.selector), item.key, "ALL");
		});

		// Initially display results
		filterResults();

		// hide loading screen
		loadingScreen.classList.remove("loading-visible");
		loadingScreen.classList.add("loading-hidden");
	}

	function populateDropdown(element, options) {
		try {
			if (!element) throw new Error("Dropdown element not found");

			// Reset dropdown
			element.innerHTML = "";

			// add ALL to top of list
			const optionElement = document.createElement("option");
			optionElement.value = 'ALL';
			optionElement.textContent = 'ALL';
			element.appendChild(optionElement);

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


	function getQueryParam(name) {
		const urlParams = new URLSearchParams(window.location.search);
		return urlParams.get(name); // Returns the value of the parameter
	}

	function initializeSingleSelect(element, paramName, defaultValue) {
		$(element).selectpicker("refresh");
		$(element).selectpicker({
			noneSelectedText: "Select an option",
			liveSearch: true,
			actionsBox: false,
		});

		// Get the GET parameter value
		const preselectValue = getQueryParam(paramName) || defaultValue; // Default to "ALL" if no parameter is found

		// Select the preselected or default value
		if (preselectValue) {
			$(element).val(preselectValue).selectpicker("refresh");
		}
	}

	// Add this function near the top with other initializations
	function displayFeatured() {
		const dropdowns = document.querySelectorAll("select.filter-dropdown");
		const contentElement = document.querySelector(
			".content-results-mobile-desktop"
		);
		const hasSelection = Array.from(dropdowns).some((dropdown) => {
			// if (dropdown.id === 'catLocation') return false; // Exclude Location dropdown

			const selectedValues = Array.from(dropdown.selectedOptions).map(
				(option) => option.value
			);
			return selectedValues.length > 0 && !selectedValues.includes("ALL");
		});
		
		// if no filters selected the set that cout to zero and hide all the cards
		if(!hasSelection)
			updateTotalResults('featured',0);
		contentElement.classList.toggle("filters-activated", hasSelection);
	}


	function displayResults(section,data) {

		cards = "";

		// Iterate through filtered data and append to respective sections

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
						 data-id="${item.id}"
						 data-bs-target="#descriptionModal"
						 data-content="${"No description available."}">
						 Read More
					 </button>
					 <div class='card-description-hidden d-none' id="cardDescription"><p>No description available.</p></div>
				 </div>
			 </div>
			`;

			cards += card;
		});

		screenSections[section].innerHTML = cards;
	}


	// clean up excerpt
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

	function updateTotalResults(section,count) {
		totalResultsElement[section].textContent = count;
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

	// scroll event handling
	document.querySelectorAll(
			".regional-section-wrapper, .national-section-wrapper, .featured-section-wrapper"
		).forEach((sectionElement) => {
			sectionElement.addEventListener("scroll", throttle(async function () {
				
				const scrollTop = this.scrollTop;
				const scrollHeight = this.scrollHeight;
				const clientHeight = this.clientHeight;

				if (scrollTop + clientHeight >= scrollHeight - 10) {
					if (this.className.match(/(\S+)-section-wrapper/)) {
						section = this.className.match(/(\S+)-section-wrapper/)[1];
						console.log(section);
					}

					// Load more data
					const startIndex = displayedData[section].length;
					const nextBatch = filteredData[section].slice(startIndex, startIndex + itemsPerLoad);
					displayedData[section] = [...displayedData[section], ...nextBatch];

					// Update UI
					displayResults(section,displayedData[section], true);
					//updateTotalResults(section,filteredData[section].length);

				}
			}, 200)); // Throttling to run every 200ms
		});

	// clear filters handling
	document.getElementById("clear-filters").addEventListener("click", () => {
		dropdownKeys.forEach(({ selector }) => {
			const dropdownElement = document.querySelector(selector);
			$(dropdownElement).selectpicker('val', 'ALL');
			$(dropdownElement).selectpicker("refresh");
		});

		// Remove filters from the URL
		history.replaceState(null, "", window.location.pathname);

		sections.forEach((section) => {
			filteredData[section] = window.sectionData[section];
			displayedData[section] = filteredData[section].slice(0, itemsPerLoad);
			displayResults(section,displayedData[section]);
			updateTotalResults(section,filteredData[section].length);
		});
		
		displayFeatured();
	});

	// Handle the "Read More" button click
	jQuery(document).on("click", ".read-more", function () {
		// Find the sibling .content-hidden div
		const contentElement = $(this).siblings("#cardDescription");
		const titleElement = $(this)
			.closest(".card-body")
			.find(".card-title");
		var selectedItemHTML = "";
		const uniqueId = $(this).data("id");
		console.log("id:",uniqueId);

		// Find the corresponding item
		let selectedItem;
		sections.some((section) => {
			selectedItem = window.sectionData[section].find(
				(item) => item.id === uniqueId
			);
			return !!selectedItem; // Stops iteration when a match is found
		});		

		selectedItemHTML = selectedItem.body;

		// Update modal title dynamically
		if (titleElement.length > 0) {
			$("#descriptionModalLabel").text(titleElement.text());
		} else {
			$("#descriptionModalLabel").text("Details"); // Fallback title
		}

		// Check if the content element exists
		if (selectedItemHTML.length > 0) {
			// Load the sibling content into the modal
			$("#descriptionModal .modal-body").html(selectedItemHTML);
		} else {
			$("#descriptionModal .modal-body").html(
				"<p>No description available.</p>"
			);
		}
	
		// display the modal properly
		$("#descriptionModal").appendTo("body")
	});

	// Ensure modal-backdrop is appended correctly
	$(document).on("show.bs.modal", function () {
		$(".modal-backdrop").appendTo("body");
	});

	// use submit button instead
	document.getElementById("submit-btn").addEventListener("click", () => {
		if(filterResults()) {
		
			// scroll to different elements depending on mobile or desktop view
			var element = document.querySelector('#resultsTabs');
			if(element && isHidden(element)) {
				element = document.querySelector('.scroll-implementation');
			}
			
			if (element) {
				// Scroll to the element, positioning it near the top
				window.scrollTo({
					top: element.getBoundingClientRect().top + window.scrollY - 20, // 20px offset from the top
					behavior: 'smooth' // Smooth scrolling animation
				});
			}
		}
	});

	// Where el is the DOM element you'd like to test for visibility
	function isHidden(el) {
		var style = window.getComputedStyle(el);
		return (style.display === 'none')
	}
	
	function filterResults() {
		try {
			const filters = {};
			dropdownKeys.forEach(({ key, selector }) => {
				const selectedValues = getSelectedValues(selector);
				if (selectedValues !== null) filters[key] = selectedValues;
			});

			var totalCount = 0;

			sections.forEach((section) => {

				filteredData[section] = window.sectionData[section].filter((item) => {
					return Object.entries(filters).every(([key, values]) => {
						// If section is "national" and filter key is "catLocation", bypass the filter
						if (section === "national" && key === "catLocation") {
							return true; // Treat as if all filter values are selected
						}

						let categoryArray = Array.isArray(item[key])
							? item[key]
							: item[key]
								? [item[key]]
								: [];
						
					if (section === "featured")
						values.push("NATIONAL ORGANISATIONS");
						
						return values.some((value) =>
							categoryArray.some(
								(cat) => cat.trim().toLowerCase() === value.trim().toLowerCase()
							)
						);
					});
				});


				displayedData[section] = filteredData[section].slice(0, itemsPerLoad);
				totalCount += filteredData[section].length;
				displayResults(section,displayedData[section], true);
				updateTotalResults(section,filteredData[section].length);
			})
			
			displayFeatured();

			// display "no results" if necessary
			console.log(totalCount);
			const noResultsWrapper = document.querySelector(".no-results-wrapper");

			if (totalCount === 0) {
				noResultsWrapper.classList.remove("d-none"); // Hide if count is 0
			} else {
				noResultsWrapper.classList.add("d-none"); // Show if count > 0
			}			
			
			return totalCount > 0;
			
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
		return values.length === 0 || values.includes("--") || values[0] === 'ALL' ? null : values;
	}


	initialise();
});
