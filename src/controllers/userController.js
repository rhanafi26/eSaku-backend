const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        currency: true,
        notificationEmail: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
};

// Update notification email
exports.updateNotificationEmail = async (req, res) => {
  try {
    const userId = req.userId;
    const { notificationEmail } = req.body;

    if (!notificationEmail) {
      return res.status(400).json({ error: 'Email tidak boleh kosong' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { notificationEmail },
      select: {
        id: true,
        email: true,
        username: true,
        currency: true,
        notificationEmail: true,
      },
    });

    res.json({
      message: 'Email notifikasi berhasil diupdate',
      user,
    });
  } catch (error) {
    console.error('Update notification email error:', error);
    res.status(500).json({ error: 'Gagal update email notifikasi' });
  }
};