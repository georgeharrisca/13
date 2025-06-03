document.addEventListener("DOMContentLoaded", () => {
  // Initialize OSMD (OpenSheetMusicDisplay)
  const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("osmd-container");

  // Get references to the dropdown and button
  const fileSelect = document.getElementById("fileSelect");
  const loadButton = document.getElementById("loadButton");

  // Add click event to the "Visualize" button
  loadButton.addEventListener("click", async () => {
    const selectedFile = fileSelect.value;

    if (!selectedFile) {
      alert("Please select an XML file to visualize.");
      return;
    }

    try {
      // Fetch the raw XML file from GitHub
      const response = await fetch(selectedFile);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text();

      // Load and render the sheet music
      await osmd.load(xmlText);
      osmd.render();
    } catch (error) {
      console.error("Error loading or rendering the XML file:", error);
      document.getElementById("osmd-container").innerText =
        "Failed to load or render the selected XML file.";
    }
  });
});
