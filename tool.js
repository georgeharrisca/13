document.addEventListener("DOMContentLoaded", () => {
  const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("osmd-container");
  const fileSelect = document.getElementById("fileSelect");
  const loadButton = document.getElementById("loadButton");

  // ✅ Replace with raw GitHub URLs to your XML files
  const xmlFiles = [
    {
      name: "tbm",
      file: "https://raw.githubusercontent.com/georgeharrisca/13/main/tbm.xml"
    },
  ];

  // Populate the dropdown
  xmlFiles.forEach(({ name, file }) => {
    const option = document.createElement("option");
    option.value = file;
    option.textContent = name;
    fileSelect.appendChild(option);
  });

  // Load and render the selected XML
  loadButton.addEventListener("click", async () => {
    const selectedFile = fileSelect.value;
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    try {
      const response = await fetch(selectedFile);
      const xml = await response.text();
      await osmd.load(xml);
      osmd.render();
    } catch (error) {
      console.error("Error loading XML:", error);
      document.getElementById("osmd-container").innerText = "Failed to load XML file.";
    }
  });
});
