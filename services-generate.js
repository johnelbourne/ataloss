const USERNAME = 'johnelbourne';
const REPO = 'ataloss';
const BRANCH = 'main';
const FILE_PATH = 'services-data.js';
const COMMIT_MESSAGE = 'Services Data Update';
const BASE_URL = window.location.origin;


window.addEventListener("load", function () {

	function logToPopup(msg) {
	  const p = document.createElement("p");
	  p.style.margin = "0 0 10px";
	  p.textContent = msg;
	  const logArea = getLogArea();
	  logArea.appendChild(p);
	  logArea.scrollTop = logArea.scrollHeight;
	}

	function showCloseButton() {
	  const btn = document.createElement("button");
	  btn.textContent = "Close";
	  btn.style.marginTop = "10px";
	  const popup = getPopup();
	  btn.onclick = () => popup.remove();
	  popup.appendChild(btn);
	}

	function extractedData(delimiter, dataArrays) {
		const combinedData = [];
		dataArrays.forEach((data) => {
			if (data.includes(delimiter) && data.split(delimiter)[1].trim() !== "") {
				combinedData.push(data.split(delimiter)[1].trim());
			}
		});
		return [...new Set(combinedData)];
	}

	async function getServicesData() {
		logToPopup('Fetching Service Listings Blog Entries - paginated');
		
		const format = "format=json-pretty";
		const jsonPath = BASE_URL + "/more-info/bereavement-services?offset=";
		accumulatedData = [];
		let page = 0;
		try {
			offset = 9999999999999;
			const seenIds = new Set();
			while(true) {
				page += 1;
				url = jsonPath + offset + "&" + format;
				console.log("URL: " + url);
				logToPopup(`Fetching page ${page}, Services so far: ${accumulatedData.length}`);
				const response = await fetch(url);
				if (!response.ok) {
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				const data = await response.json();
				if (data.items && data.items.length > 0) {
					for (const item of data.items) {
						if (!seenIds.has(item.id)) {
							seenIds.add(item.id);
							accumulatedData.push(item);
						}
					}
				}
				if (data.pagination && data.pagination.nextPageOffset) {
					offset = data.pagination.nextPageOffset + 1;
				} else {
					break;
				}
			}
		} catch (error) {
			logToPopup("Error fetching data: " + error.message);
			return;
		}
		logToPopup("Finished loading service listings: " + accumulatedData.length);
		return accumulatedData;
	}

	function generateJavascript(servicesData) {
		let wholeCategories = {};
		let catWho = [], whoCat = [], catCDeath = [], cDeathCat = [], catAgePerson = [], agePersonCat = [], catLocation = [], locationCat = [], catType = [], typeCat = [];
		let featuredData = [], nationalData = [], regionalData = [];
		servicesData.forEach((item) => {
			catWho = extractedData("Who:", item.categories);
			catCDeath = extractedData("Cir:", item.categories);
			catAgePerson = extractedData("Age:", item.categories);
			catLocation = extractedData("Location:", item.categories);
			catType = extractedData("Type:", item.categories);
			requiredData = [{
				id: item.id,
				title: item.title,
				body: item.body,
				excerpt: item.excerpt,
				featured: item.starred,
				catWho: catWho,
				catCDeath: catCDeath,
				catAgePerson: catAgePerson,
				catLocation: catLocation,
				catType: catType,
			}];
			whoCat = [...new Set([...whoCat, ...catWho])];
			cDeathCat = [...new Set([...cDeathCat, ...catCDeath])];
			agePersonCat = [...new Set([...agePersonCat, ...catAgePerson])];
			locationCat = [...new Set([...locationCat, ...catLocation])];
			typeCat = [...new Set([...typeCat, ...catType])];
			if (item.starred) featuredData.push(...requiredData);
			if (catLocation.includes("NATIONAL ORGANISATIONS")) {
				nationalData.push(...requiredData);
			} else {
				regionalData.push(...requiredData);
			}
		});
		wholeCategories = {
			catWho: whoCat.sort(),
			catCDeath: cDeathCat.sort(),
			catAgePerson: agePersonCat.sort(),
			catLocation: locationCat.sort(),
			catType: typeCat.sort(),
		};
		logToPopup("Featured Services: " + featuredData.length);
		logToPopup("Regional Services: " + regionalData.length);
		logToPopup("National Services: " + nationalData.length);
		logToPopup("Total    Services: " + (regionalData.length + nationalData.length));
		
		if (featuredData.length < 10 || regionalData.length < 1300 || nationalData.length < 150) {
			throw new Error(`Error retrieving services - the counts are too low`);
		}
		
		
		content = '// Auto generated file with services data for the sevices search tool at\n';
		content += '// https://ataloss.squarespace.com/bereavement-services\n\n';
		content += `window.wholeCategories = ${JSON.stringify(wholeCategories, null, 2)};\n\n`;
		featuredData.sort((a, b) => a.title.localeCompare(b.title));
		nationalData.sort((a, b) => a.title.localeCompare(b.title));
		regionalData.sort((a, b) => a.title.localeCompare(b.title));
		content += 'window.sectionData = [];\n\n';
		content += `window.sectionData['featured'] = ${JSON.stringify(featuredData, null, 2)};\n\n`;
		content += `window.sectionData['national'] = ${JSON.stringify(nationalData, null, 2)};\n\n`;
		content += `window.sectionData['regional'] = ${JSON.stringify(regionalData, null, 2)};\n\n`;
		logToPopup("Generated JavaScript data file: " + content.length + " bytes");
		return content;
	}

	async function getGitHubSha(githubToken) {
		const url = `https://api.github.com/repos/${USERNAME}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
		const res = await fetch(url, {
			headers: {
				'Authorization': `Bearer ${githubToken}`,
				'Accept': 'application/vnd.github+json'
			}
		});
		if (!res.ok) {
			throw new Error(`Wrong GitHub token`);
		}
		const data = await res.json();
		return data.sha;
	}

	async function updateGitHub(githubToken,sha, base64Content, commitMessage) {
	
		logToPopup('Uploading file to GitHub ...');
		const url = `https://api.github.com/repos/${USERNAME}/${REPO}/contents/${FILE_PATH}`;
		const body = {
			message: commitMessage,
			content: base64Content,
			sha: sha,
			branch: BRANCH
		};
		const res = await fetch(url, {
			method: 'PUT',
			headers: {
				'Authorization': `Bearer ${githubToken}`,
				'Accept': 'application/vnd.github+json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});
		const data = await res.json();
		console.log(data);
		if (res.ok) {
			logToPopup('✅ File updated to GitHub: ' + data.content.path);
			
			const newSha = data.commit.sha;

			const commitRes = await fetch(`https://api.github.com/repos/${USERNAME}/${REPO}/commits/${newSha}`, {
				headers: {
					'Authorization': `Bearer ${githubToken}`,
					'Accept': 'application/vnd.github+json'
				}
			});

			const commitData = await commitRes.json();
			console.log(commitData);
			const fileStats = commitData.files.find(f => f.filename === FILE_PATH);
			if (fileStats) {
				logToPopup(`✅ File updated: +${fileStats.additions}, -${fileStats.deletions}, Δ${fileStats.changes}`);
			}
			else {
				logToPopup("✅ No changes");
			}
		} else {
			logToPopup('❌ Error: ' + JSON.stringify(data));
		}
	}

	function getLogArea() {
		return document.getElementById('logPopup');
	}
	
	function getPopup() {
		return document.getElementById('popup');
	}
	
	document.getElementById("downloadBtn").addEventListener("click", () => {

		(async () => {
			try {

				// Create a popup window
				const popup = document.createElement("div");
				popup.id = "popup";
				popup.style.position = "fixed";
				popup.style.top = "20px";
				popup.style.right = "20px";
				popup.style.backgroundColor = "#333";
				popup.style.color = "#fff";
				popup.style.padding = "20px";
				popup.style.borderRadius = "8px";
				popup.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
				popup.style.fontFamily = "sans-serif";
				popup.style.maxWidth = "1000px";
				popup.style.zIndex = 10000;
				popup.style.fontSize = "14px";

				const logArea = document.createElement("div");
				logArea.id = "logPopup";
				logArea.style.maxHeight = "800px";
				logArea.style.overflowY = "auto";

				document.body.appendChild(popup);
				popup.appendChild(logArea);
				logToPopup('Generating Services Data Cache File');

				const githubToken = document.getElementById('patPassword').value;
				const sha = await getGitHubSha(githubToken);
				const servicesData = await getServicesData();
				if (servicesData.length > 0) {
					const content = generateJavascript(servicesData);
					const base64Content = btoa(unescape(encodeURIComponent(content)));
					await updateGitHub(githubToken, sha, base64Content, COMMIT_MESSAGE);
					logToPopup("✅ Update complete.");
				}
				showCloseButton();
			} catch (err) {
				logToPopup('🚨 Error: ' + err.message);
				showCloseButton();
			}
		})();
	});
});