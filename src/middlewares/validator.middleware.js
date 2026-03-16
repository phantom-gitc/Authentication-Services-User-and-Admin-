const { body, validationResult } = require("express-validator");

const resposeWithValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const registerUserValidation = [
    body("username")
        .isLength({ min: 3, max: 20 })
        .withMessage("Username must be between 3 and 20 characters"),

    body("email").isEmail().withMessage("Invalid email format"),

    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),

    body("fullName.firstName")
        .isLength({ min: 1 })
        .withMessage("First name is required"),

    body("fullName.lastName")
        .isLength({ min: 1 })
        .withMessage("Last name is required"),
    resposeWithValidationErrors,
];


const loginValidation = [
    body("email").optional().isEmail().withMessage("Invalid email format"),

    body("username")
        .optional()
        .isString()
        .isLength({ min: 3, max: 20 })
        .withMessage("Username must be between 3 and 20 characters"),

    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),

    (req, res, next) => {
        if (!req.body.email && !req.body.username) {
            return res
                .status(400)
                .json({ message: "Either email or username is required" });
        }
        resposeWithValidationErrors(req, res, next)
    },

];

module.exports = {
    registerUserValidation,
    loginValidation,
};
