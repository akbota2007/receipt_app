const User = require('../models/User');
const Receipt = require('../models/Receipt');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      username: req.body.username,
      email: req.body.email,
      avatar: req.body.avatar
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    await Receipt.deleteMany({ user: user._id });
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User and all their receipts deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

exports.deleteAllUsers = async (req, res, next) => {
  try {
    const usersToDelete = await User.find({ _id: { $ne: req.user.id } });

    const userIds = usersToDelete.map(u => u._id);

    await Receipt.deleteMany({ user: { $in: userIds } });

    await User.deleteMany({ _id: { $ne: req.user.id } });

    res.status(200).json({
      success: true,
      message: 'All users (except admin) and their receipts deleted'
    });

  } catch (error) {
    next(error);
  }
};

exports.deleteMyAccount = async (req, res, next) => {
  try {
    await Receipt.deleteMany({ user: req.user.id });

    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Account and all receipts deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};
