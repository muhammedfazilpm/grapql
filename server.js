const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLID, GraphQLList } = require('graphql');
const mongoose = require('mongoose');
const cors=require('cors')
// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mydatabase', { useNewUrlParser: true, useUnifiedTopology: true });

// Define User model (assuming you're using Mongoose)
const User = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
}));



// Define the User type
const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
  }),
});

// Define the Root Query
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    users: {
      type: new GraphQLList(UserType),
      resolve: async () => {
        return await User.find();
      },
    },
    user: {
      type: UserType,
      args: { id: { type: GraphQLID } },
      resolve: async (parent, args) => {
        return await User.findById(args.id);
      },
    },
  },
});

// Define the Mutation type
const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createUser: {
      type: UserType,
      args: {
        name: { type: GraphQLString },
        email: { type: GraphQLString },
      },
      resolve: async (parent, args) => {
        const user = new User({ name: args.name, email: args.email });
        await user.save();
        return user;
      },
    },
    updateUser: {
      type: UserType,
      args: {
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        email: { type: GraphQLString },
      },
      resolve: async (parent, args) => {
        const user = await User.findById(args.id);
        if (args.name) user.name = args.name;
        if (args.email) user.email = args.email;
        await user.save();
        return user;
      },
    },
    deleteUser: {
      type: GraphQLString,
      args: { id: { type: GraphQLID } },
      resolve: async (parent, args) => {
        await User.findByIdAndRemove(args.id);
        return "User deleted";
      },
    },
  },
});

// Create the schema
const schema = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});

// Create an Express app
const app = express();

app.use(cors())


// Mount the GraphQL API
app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true,
}));

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
