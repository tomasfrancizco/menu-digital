const express = require("express");
const userRouter = express.Router();
const passport = require("passport");
const passportConfig = require("../passport");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const MenuItem = require("../models/MenuItem");
const Menu = require("../models/Menu");

const signToken = (userID) => {
  return jwt.sign(
    {
      iss: "tomasfrancizco",
      sub: userID,
    },
    "tomasfrancizco",
    { expiresIn: "24h" }
  );
};

// Register
userRouter.post("/register", (req, res) => {
  const { username, password, role } = req.body;
  User.findOne({ username }, (err, user) => {
    if (err) {
      res.status(500).json({
        message: {
          msgBody: "An error has occured finding the user",
          msgError: true,
        },
      });
    }
    if (user) {
      res.status(400).json({
        message: { msgBody: "username already in use", msgError: true },
      });
    } else {
      const newUser = new User({ username, password, role });
      newUser.save((err) => {
        if (err) {
          res.status(500).json({
            message: {
              msgBody: "An error has occured creating the user",
              msgError: true,
            },
          });
        } else {
          res.status(201).json({
            message: {
              msgBody: "Account successfully created",
              msgError: false,
            },
          });
        }
      });
    }
  });
});

// Login
userRouter.post(
  "/login",
  passport.authenticate("local", { session: false }),
  (req, res) => {
    if (req.isAuthenticated()) {
      const { _id, username, role } = req.user;
      const token = signToken(_id);
      res.cookie("access_token", token, { httpOnly: true, sameSite: true });
      res.status(200).json({ isAuthenticated: true, user: { username, role } });
    }
  }
);

// Logout
userRouter.get(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.clearCookie("access_token");
    res.json({ user: { username: "", role: "" }, success: true });
  }
);

// Edit User
userRouter.patch(
  "/edit",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { _id } = req.user;
    User.findByIdAndUpdate(_id, { $set: { ...req.body } }, { new: true })
      .then((user) => {
        res.status(200).json({ user });
      })
      .catch((err) => err);
  }
);

// Para la Home, para ver la lista de menues
userRouter.get(
  "/menus",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { _id } = req.user;
    Menu.find({ user: _id })
      .then((menus) => res.status(200).json({ menus }))
      .catch((error) => {
        res.status(500).json({
          message: {
            msgBody: "An error has occured",
            msgError: true,
          },
        });
      });
  }
);

// Para que renderee el componente MenuItems, me trae un solo menu y sus detalles
userRouter.get(
  "/menu/:name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { name } = req.params;
    const { _id } = req.user;
    Menu.findOne({ user: _id, businessName: name })
      .populate("items")
      .exec((err, document) => {
        if (err) {
          res.status(500).json({
            message: {
              msgBody: "An error has occured",
              msgError: true,
            },
          });
        } else {
          res.status(200).json({ menu: document, authenticated: true });
        }
      });
  }
);

// Para crear un nuevo menu con el nombre y telefono
userRouter.post(
  "/menu",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { name, phone } = req.body;
    const { _id } = req.user;
    Menu.findOne({ businessName: name })
      .then((doc) => {
        if (!doc) {
          const newMenu = new Menu({
            user: _id,
            businessName: name,
            businessPhone: phone,
          });
          newMenu.save();
          req.user.menus.push(newMenu);
          // Chequear este issue si descomento lo que va en save y ejecuto:
          // Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
          req.user
            .save
            //   (err) => {
            //   if (err) {
            //     res.status(500).json({
            //       message: {
            //         msgBody: "An error has occured while saving the user",
            //         msgError: true,
            //       },
            //     });
            //   } else {
            //     res.status(200).json({
            //       message: {
            //         msgBody: "Successfully created menu",
            //         msgError: false,
            //       },
            //     });
            //   }
            // }
            ();

          res.status(200).json({
            message: {
              msgBody: "Successfully created menu",
              msgError: false,
            },
          });
        } else {
          res.status(500).json({
            message: {
              msgBody: "Business already exists",
              msgError: true,
            },
          });
        }
      })
      .catch((err) => {
        res.status(500).json({
          message: {
            msgBody: err,
            msgError: true,
          },
        });
      });
  }
);

// Para ver el detalle de cada menu item en la edición
userRouter.get(
  "/menu-item/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { id } = req.params;
    MenuItem.findById(id)
      .then((item) => {
        res.status(200).json({ item });
      })
      .catch((err) => {
        res.status(500).json({
          message: {
            msgBody: "An error has occured retrieving the item",
            msgError: true,
          },
        });
      });
  }
);

// Crear menu-item
userRouter.post(
  "/menu-item/:menu",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const menuItem = new MenuItem(req.body);
    const { menu } = req.params;
    menuItem.save((err, doc) => {
      if (err) {
        res.status(500).json({
          message: {
            msgBody: "An error has occured creating the menu item",
            msgError: true,
          },
        });
      } else {
        Menu.findOneAndUpdate(
          { businessName: menu },
          { $push: { items: doc._id } }
        )
          .then(() => {
            res.status(200).json({
              message: {
                msgBody: "Successfully created menu item",
                msgError: false,
              },
            });
          })
          .catch(() => {
            res.status(500).json({
              message: {
                msgBody: "An error has occured while creating menu-item",
                msgError: true,
              },
            });
          });
      }
    });
  }
);

// Delete menu-item
userRouter.delete(
  "/menu-item/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { id } = req.params;
    MenuItem.findOneAndRemove({ _id: id })
      .then((item) => {
        Menu.findOneAndUpdate(
          { user: req.user._id, businessName: item.menu },
          { $pull: { items: id } }
        )
          .then((menu) => {
            res.status(200).json({
              message: {
                msgBody: "Successfully removed menu-item",
                msgError: false,
              },
            });
          })
          .catch((err) => {
            res.status(500).json({
              message: {
                msgBody: "There was an error deleting the menu-item",
                msgError: true,
              },
            });
          });
      })
      .catch((error) => {
        res.status(500).json({
          error,
          message: "There was an error deleting the item",
        });
      });
  }
);

// Editar menu-item
userRouter.patch(
  "/menu-item/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { id } = req.params;
    MenuItem.findOneAndUpdate(
      { _id: id },
      { $set: { ...req.body } },
      { new: true }
    )
      .then((item) => {
        res.status(200).json({ item });
      })
      .catch(() => {
        res.status(500).json({
          error,
          message: "There was an error editin the item",
        });
      });
  }
);

userRouter.get(
  "/admin",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.role === "admin") {
      res
        .status(200)
        .json({ message: { msgBody: "You are an admin", msgError: false } });
    } else {
      res
        .status(403)
        .json({ message: { msgBody: "Unauthorized access", msgError: true } });
    }
  }
);

userRouter.get(
  "/authenticated",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { username, role } = req.user;
    res.status(200).json({ authenticated: true, user: { username, role } });
  }
);

module.exports = userRouter;
