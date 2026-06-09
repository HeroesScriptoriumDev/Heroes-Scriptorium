const jwt = require("jsonwebtoken");

module.exports = function (

    request,
    response,
    next

) {

    try {

        let token = request.header("token");

if (!token) {
    const authHeader = request.header("Authorization");

    if (authHeader) {
        token = authHeader.replace("Bearer ", "");
    }
}

        if (!token) {

            return response.status(401).json({

                error: "Unauthorized"

            });

        }

        const payload = jwt.verify(
    token,
    process.env.JWT_SECRET
);

request.user = payload.user;
request.userId = payload.user.id;

next();

    } catch (error) {

        console.error(error);

        response.status(401).json({

            error: "Invalid token"

        });

    }

};
