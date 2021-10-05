const loadingAnimation = <HTMLDivElement>document.querySelector(".loading-container");
const loadedContent = <HTMLDivElement>document.querySelector(".loaded-content");

if (loadedContent) {
	loadedContent.style.opacity = "0";
}
document.body.style.overflow = "hidden";

window.addEventListener("load", () => {
	document.body.style.overflowY = "visible";
	if (loadingAnimation && loadedContent) {
		loadingAnimation.style.display = "none";
		loadedContent.style.opacity = "1";
	}
});
