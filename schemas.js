const BaseJoi = require("joi");
const sanitizeHtml = require("sanitize-html");

const extension = (joi) => ({
  type: "string",
  base: joi.string(),
  messages: {
    "string.escapeHTML": "{{#label}} must not include HTML!",
  },
  rules: {
    escapeHTML: {
      validate(value, helpers) {
        const clean = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
        });
        if (clean !== value)
          return helpers.error("string.escapeHTML", { value });
        return clean;
      },
    },
  },
});

const Joi = BaseJoi.extend(extension);

module.exports = {
  campgroundSchema: Joi.object({
    campground: Joi.object({
      title: Joi.string().min(1).max(15).required().escapeHTML(),
      location: Joi.string().required().escapeHTML(),
      price: Joi.number().min(1).required(),
      description: Joi.string().required().escapeHTML(),
    }).required(),
    deletedImages: Joi.array(),
  }),
  reviewSchema: Joi.object({
    review: Joi.object({
      rating: Joi.number().required(),
      body: Joi.string().required().escapeHTML(),
    }).required(),
  }),
};
