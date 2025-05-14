import { Router, Request, Response } from 'express';
import { chatMessages, chatGroups, groupMembers, users, ChatMessage, GroupMember, ChatGroup, User, insertChatMessageSchema, insertChatGroupSchema, insertGroupMemberSchema } from '@shared/schema';
import { storage } from './db-storage';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { db } from './db';

const router = Router();

/**
 * Get messages for a specific chat
 */
router.get('/messages', async (req: Request, res: Response) => {
  try {
    const userId = Number(req.query.userId);
    const recipientId = req.query.recipientId ? Number(req.query.recipientId) : undefined;
    const groupId = req.query.groupId ? Number(req.query.groupId) : undefined;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    // Fetch messages from database
    if (db) {
      let messages;
      
      if (recipientId) {
        // Get direct messages between these users
        messages = await db.select({
          id: chatMessages.id,
          content: chatMessages.content,
          timestamp: chatMessages.timestamp,
          isRead: chatMessages.isRead,
          senderId: chatMessages.senderId,
          senderUsername: users.username,
          receiverId: chatMessages.receiverId
        })
        .from(chatMessages)
        .innerJoin(users, eq(users.id, chatMessages.senderId))
        .where(
          or(
            and(
              eq(chatMessages.senderId, userId),
              eq(chatMessages.receiverId, recipientId)
            ),
            and(
              eq(chatMessages.senderId, recipientId),
              eq(chatMessages.receiverId, userId)
            )
          )
        )
        .orderBy(chatMessages.timestamp);
      } else if (groupId) {
        // Get group messages
        messages = await db.select({
          id: chatMessages.id,
          content: chatMessages.content,
          timestamp: chatMessages.timestamp,
          senderId: chatMessages.senderId,
          senderUsername: users.username,
          groupId: chatMessages.groupId
        })
        .from(chatMessages)
        .innerJoin(users, eq(users.id, chatMessages.senderId))
        .where(eq(chatMessages.groupId, groupId))
        .orderBy(chatMessages.timestamp);
      } else {
        return res.status(400).json({ error: 'Either recipientId or groupId required' });
      }
      
      return res.json(messages);
    } else {
      // Fallback if database is not available
      return res.json([]);
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * Send a message
 */
router.post('/messages', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { content, receiverId, groupId } = req.body;
    const userId = req.user.id;
    
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    if (!receiverId && !groupId) {
      return res.status(400).json({ error: 'Either receiverId or groupId is required' });
    }
    
    // Create message in database
    if (db) {
      const [newMessage] = await db.insert(chatMessages)
        .values({
          senderId: userId,
          receiverId: receiverId || null,
          groupId: groupId || null,
          content,
          isRead: false
        })
        .returning();
      
      // Get sender username for the response
      const [sender] = await db.select({ username: users.username })
        .from(users)
        .where(eq(users.id, userId));
      
      const messageWithSender = {
        ...newMessage,
        senderUsername: sender?.username
      };
      
      // Emit to connected clients if Socket.IO is available
      const io = req.app.get('socketio');
      if (io) {
        if (groupId) {
          io.to(`group:${groupId}`).emit('new-message', messageWithSender);
        } else if (receiverId) {
          io.to(`user:${receiverId}`).emit('new-message', messageWithSender);
        }
      }
      
      return res.status(201).json(messageWithSender);
    } else {
      // Fallback without database
      const timestamp = new Date();
      const newMessage = {
        id: Date.now(),
        senderId: userId,
        receiverId: receiverId || null,
        groupId: groupId || null,
        content,
        timestamp,
        isRead: false,
        senderUsername: req.user.username
      };
      
      return res.status(201).json(newMessage);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * Mark messages as read
 */
router.post('/messages/read', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { messageIds } = req.body;
    
    if (!messageIds || !messageIds.length) {
      return res.status(400).json({ error: 'Message IDs are required' });
    }
    
    if (db) {
      // Mark messages as read
      await Promise.all(messageIds.map(id => 
        db.update(chatMessages)
          .set({ isRead: true })
          .where(eq(chatMessages.id, id))
      ));
      
      return res.json({ success: true, messagesMarkedRead: messageIds.length });
    } else {
      return res.json({ success: true, messagesMarkedRead: messageIds.length });
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

/**
 * Get all chat groups
 */
router.get('/groups', async (req: Request, res: Response) => {
  try {
    if (db) {
      // Get all active groups with member count
      const groups = await db.select({
        id: chatGroups.id,
        name: chatGroups.name,
        description: chatGroups.description,
        createdAt: chatGroups.createdAt,
        createdBy: chatGroups.createdBy,
        memberCount: sql`count(${groupMembers.id})::int`
      })
      .from(chatGroups)
      .leftJoin(groupMembers, and(
        eq(chatGroups.id, groupMembers.groupId),
        eq(groupMembers.isActive, true)
      ))
      .where(eq(chatGroups.isActive, true))
      .groupBy(chatGroups.id);
      
      return res.json(groups);
    } else {
      // Fallback without database
      return res.json([]);
    }
  } catch (error) {
    console.error('Error fetching groups:', error);
    return res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

/**
 * Create a new chat group
 */
router.post('/groups', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    
    if (db) {
      // Create the group
      const [newGroup] = await db.insert(chatGroups)
        .values({
          name,
          description: description || null,
          createdBy: req.user.id,
          isActive: true
        })
        .returning();
      
      // Add creator as a member with admin role
      await db.insert(groupMembers)
        .values({
          groupId: newGroup.id,
          userId: req.user.id,
          role: 'admin',
          isActive: true
        });
      
      // Return group with member count of 1 (just creator)
      return res.status(201).json({
        ...newGroup,
        memberCount: 1
      });
    } else {
      // Fallback without database
      return res.status(201).json({
        id: Date.now(),
        name,
        description: description || null,
        createdBy: req.user.id,
        createdAt: new Date(),
        isActive: true,
        memberCount: 1
      });
    }
  } catch (error) {
    console.error('Error creating group:', error);
    return res.status(500).json({ error: 'Failed to create group' });
  }
});

/**
 * Join a chat group
 */
router.post('/groups/join', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { groupId } = req.body;
    const userId = req.user.id;
    
    if (!groupId) {
      return res.status(400).json({ error: 'Group ID is required' });
    }
    
    if (db) {
      // Check if group exists
      const [group] = await db.select()
        .from(chatGroups)
        .where(and(
          eq(chatGroups.id, groupId),
          eq(chatGroups.isActive, true)
        ));
      
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Check if user is already a member
      const [existingMembership] = await db.select()
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId)
        ));
      
      if (existingMembership) {
        if (existingMembership.isActive) {
          return res.status(400).json({ error: 'Already a member of this group' });
        } else {
          // Reactivate membership
          await db.update(groupMembers)
            .set({ isActive: true })
            .where(eq(groupMembers.id, existingMembership.id));
        }
      } else {
        // Add user as new member
        await db.insert(groupMembers)
          .values({
            groupId,
            userId,
            role: 'member',
            isActive: true
          });
      }
      
      // Get updated group with member count
      const [updatedGroup] = await db.select({
        id: chatGroups.id,
        name: chatGroups.name,
        description: chatGroups.description,
        createdAt: chatGroups.createdAt,
        createdBy: chatGroups.createdBy,
        memberCount: sql`count(${groupMembers.id})::int`
      })
      .from(chatGroups)
      .leftJoin(groupMembers, and(
        eq(chatGroups.id, groupMembers.groupId),
        eq(groupMembers.isActive, true)
      ))
      .where(eq(chatGroups.id, groupId))
      .groupBy(chatGroups.id);
      
      return res.json({ success: true, group: updatedGroup });
    } else {
      // Fallback without database
      return res.json({ success: true });
    }
  } catch (error) {
    console.error('Error joining group:', error);
    return res.status(500).json({ error: 'Failed to join group' });
  }
});

/**
 * Leave a chat group
 */
router.post('/groups/leave', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { groupId } = req.body;
    const userId = req.user.id;
    
    if (!groupId) {
      return res.status(400).json({ error: 'Group ID is required' });
    }
    
    if (db) {
      // Find membership
      const [membership] = await db.select()
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId),
          eq(groupMembers.isActive, true)
        ));
      
      if (!membership) {
        return res.status(404).json({ error: 'Not a member of this group' });
      }
      
      // Set membership as inactive
      await db.update(groupMembers)
        .set({ isActive: false })
        .where(eq(groupMembers.id, membership.id));
      
      return res.json({ success: true });
    } else {
      // Fallback without database
      return res.json({ success: true });
    }
  } catch (error) {
    console.error('Error leaving group:', error);
    return res.status(500).json({ error: 'Failed to leave group' });
  }
});

/**
 * Get available users for chat
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const currentUserId = req.user.id;
    
    if (db) {
      // Get all users except current user
      const chatUsers = await db.select({
        id: users.id,
        username: users.username,
        name: users.name
      })
      .from(users)
      .where(
        users.id !== currentUserId
      );
      
      return res.json(chatUsers);
    } else {
      // Fallback without database
      return res.json([]);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;