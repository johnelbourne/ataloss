$(document).ready(function () {
	// Handle the "Read More" button click
	$(document).on("click", ".read-more", function () {
		// Find the sibling .content-hidden div
		const contentElement = $(this).siblings("#cardDescription");
		const titleElement = $(this)
			.closest(".card-body")
			.find(".card-title");
		var selectedItemHTML = "";
		const uniqueId = $(this).data("id");

		const cachedData =
			window.originalData
			//JSON.parse(localStorage.getItem("originalDataCache")) || [];

		// Find the corresponding item in the cache
		const selectedItem = cachedData.find(
			(item) => item.displayIndex === uniqueId
		);
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
		$("#descriptionModal")
			.appendTo("body")
			.modal({
				backdrop: "static", // Ensure backdrop behaves as expected
				keyboard: true,
			})
			.modal("show");
	});

	// Ensure modal-backdrop is appended correctly
	$(document).on("show.bs.modal", function () {
		$(".modal-backdrop").appendTo("body");
	});
});