const express = require("express");
const userRouter = express.Router();
const passport = require("passport");
const passportConfig = require("../passport");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const MenuItem = require("../models/MenuItem");
const Menu = require("../models/Menu");
const { isValidObjectId } = require("mongoose");

const ObjectId = require("mongoose").Types.ObjectId;

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
        message: { msgBody: "Username already taken", msgError: true },
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

userRouter.get(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.clearCookie("access_token");
    res.json({ user: { username: "", role: "" }, success: true });
  }
);

userRouter.post(
  "/menu",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const menu = new Menu(req.body);
    menu.save((err) => {
      if (err) {
        res.status(500).json({
          message: {
            msgBody: "An error has occured creating the menu",
            msgError: true,
          },
        });
      } else {
        req.user.menu.push(menu);
        req.user.save((err) => {
          if (err) {
            res.status(500).json({
              message: {
                msgBody: "An error has occured",
                msgError: true,
              },
            });
          } else {
            res.status(200).json({
              message: {
                msgBody: "Successfully created menu",
                msgError: false,
              },
            });
          }
        });
      }
    });
  }
);

userRouter.get(
  "/menu",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Menu.findOne({ user: req.user._id })
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
          console.log({ document });
          res.status(200).json({ menu: document.items, authenticated: true });
        }
      });
  }
);

userRouter.post(
  "/menu-item",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const menuItem = new MenuItem(req.body);
    menuItem.save((err) => {
      if (err) {
        res.status(500).json({
          message: {
            msgBody: "An error has occured creating the menu item",
            msgError: true,
          },
        });
      } else {
        req.user.menuItems.push(menuItem);
        req.user.save((err) => {
          if (err) {
            res.status(500).json({
              message: {
                msgBody: "An error has occured while saving the user",
                msgError: true,
              },
            });
          } else {
            res.status(200).json({
              message: {
                msgBody: "Successfully created menu item",
                msgError: false,
              },
            });

            Menu.find({ user: new ObjectId(req.user._id) }, (err, menu) => {
              if (err) {
                res.status(500).json({
                  message: {
                    msgBody: "An error has occured while retrieving the menu",
                    msgError: true,
                  },
                });
              } else {
                if (menu.length === 1) {
                  menu[0].items.push(menuItem);
                  menu[0].save(function (err, docs) {
                    if (err) {
                      res.status(500).json({
                        message: {
                          msgBody: "An error has occured while saving the menu",
                          msgError: true,
                        },
                      });
                    } else {
                      return docs;
                    }
                  });
                } else {
                  const menu = new Menu({
                    user: req.user._id,
                    items: [menuItem],
                  });
                  menu.save(function (err) {
                    if (err) {
                      res.status(500).json({
                        message: {
                          msgBody: "An error has occured while saving the menu",
                          msgError: true,
                        },
                      });
                    } else {
                      res.status(200).json({
                        message: {
                          msgBody: "Successfully added item to menu",
                          msgError: false,
                        },
                      });
                    }
                  });
                }
              }
            });
          }
        });
      }
    });
  }
);

userRouter.get(
  "/menu-items",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.findById({ _id: req.user._id })
      .populate("menuItems")
      .exec((err, document) => {
        if (err) {
          res.status(500).json({
            message: {
              msgBody: "An error has occured",
              msgError: true,
            },
          });
        } else {
          res
            .status(200)
            .json({ menuItems: document.menuItems, authenticated: true });
        }
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
