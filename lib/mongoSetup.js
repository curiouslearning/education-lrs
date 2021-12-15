db.posts.insertOne({
  title: 'Post One',
  body: 'Body of post one',
  category: 'News',
  likes: 4,
  tags: ['news', 'events'],
  user: {
    name: 'John Doe',
    status: 'author',
  },
  date: Date()
})
