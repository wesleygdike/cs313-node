function login() {
	var username = $("#username").val();

	var params = {
		username: username
	};

	$.post("/login", params, function(result) {
		if (result && result.success) {
			$("#status").text("Successfully logged in.");
		} else {
			$("#status").text("Error logging in. Try a new username");
		}
	});
}