import "../styles/style.scss";
import "../fonts/fonts.css";

/* Communicate between the iframe and the page, so the iframe can tell the page to change its url when the "join" letters are clicked  */
window.addEventListener(
	"message",
	(event) => {
		// Do we trust the sender of this message?
		if (event.origin !== window.location.origin) {
			return;
		}
		if (event && event.data === "join") {
			window.location.hash = "join";
		}
	},
	false
);
