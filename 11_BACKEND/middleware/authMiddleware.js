const jwt = require("jsonwebtoken");

module.exports = function (

    request,
    response,
    next

) {

    try {

        const token =
            request.header("token");

        if (!token) {

            return response.status(401).json({

                error: "Unauthorized"

            });

        }

        const payload =
            jwt.verify(

                token,

                process.env.JWT_SECRET

            );

        request.user =
            payload.user;

        next();

    } catch (error) {

        console.error(error);

        response.status(401).json({

            error: "Invalid token"

        });

    }

};