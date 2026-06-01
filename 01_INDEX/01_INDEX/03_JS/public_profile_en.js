async function loadPublicProfile() {

    try {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const userId =
            params.get("id");

        if (!userId) {

            alert(
                "No user specified."
            );

            return;

        }

        const response =
            await fetch(
                `/api/public-profile/${userId}`
            );

        if (!response.ok) {

            throw new Error(
                "Failed to load profile."
            );

        }

        const profile =
            await response.json();

        document.getElementById(
            "profile-name"
        ).textContent =
            profile.display_name || "Unknown";

        document.getElementById(
            "profile-title"
        ).textContent =
            profile.title || "";

        document.getElementById(
            "profile-username"
        ).textContent =
            profile.username;

        document.getElementById(
            "profile-pronouns"
        ).textContent =
            profile.pronouns || "Not specified";

        document.getElementById(
            "profile-status"
        ).textContent =
            profile.online_status;

        document.getElementById(
            "profile-bio"
        ).textContent =
            profile.bio || "";

        if (profile.avatar_url) {

            document.getElementById(
                "profile-avatar"
            ).src =
                profile.avatar_url;

        }

    }

    catch (error) {

        console.error(error);

    }

}

loadPublicProfile();
