## About
This web app is meant for group events with have shared expenses, for example group cooking or holidays:
The individual members of a group can enter which expenses they had, and the app calculates a list of payments with
which all the expenses can be settled. This is typically possible with much less payments than would be needed if
everyone paid everybody else directly the amount they owe them, but it's complicated to calculate this by hand, hence
this process can be simplified by this app.
 
The usage idea is to have a website which lets users create events. The event can be shared with friends by using a
secret link. Friends can then add expenses and see who has to pay money to who in order to settle all expenses.

## Data model
The data model is designed around *group events*, which represent events for which expenses are shared. Each event has a
number of *group members*, which are represented by their name, and *expenses*. 

An expense consists of the amount of money that was payed, the id of the *paying group member* and a list of 
*sharing group members*: These can be either all members of the group (represented implicitly by the [] value, in order
keep consistency when group members are added later) or a list of ids of group members which share the expense among 
each other. Note that the paying group member does not need to be a sharing group member: For example, if Alice pays for 
Bob's lunch because he doesn't have cash with him, then Alice could enter an expense with herself as the paying and Bob
as the only sharing group member.
Additional, optional data includes a description for the expense and the date it was paid.

## Routes
The web server offers several routes for adding, accessing and deleting group events, group members and expenses.
Also, it has a route to calculate a list of transactions which can be used to settle the expenses: The algorithm for
calculating the transactions is explained below.

##### Group events:

| Function        | Route | 
| ------------- | ------------- |
| Add group event | **POST** /groupEvents |
| Get list of group events *(only for development, not for final version!)* | **GET** /groupEvents |
| Get group event | **GET** /groupEvents/:id |
| Edit group event | **PUT** /groupEvents/:id |
| Delete group event | **DELETE** /groupEvents/:id |

##### Group members:

| Function        | Route | 
| ------------- | ------------- |
| Add group member | **POST** /groupEvents/:groupEventId/members |
| Get list of group members | **GET** /groupEvents/:groupEventId/members |
| Get group member | **GET** /groupEvents/:groupEventId/members/:id |
| Edit group member | **PUT** /groupEvents/:groupEventId/members/:id |
| Delete group member | **DELETE** /groupEvents/:groupEventId/members/:id |

##### Expenses:

| Function        | Route | 
| ------------- | ------------- |
| Add an expense | **POST** /groupEvents/:groupEventId/expenses |
| Get list of expenses | **GET** /groupEvents/:groupEventId/expenses |
| Get list of expenses with detailed group member data | **GET** /groupEvents/:groupEventId/expenses-detailed |
| Get expense | **GET** /groupEvents/:groupEventId/expenses/:id |
| Get expense with detailed group member data | **GET** /groupEvents/:groupEventId/expenses-detailed/:id |
| Edit expense | **PUT** /groupEvents/:groupEventId/expenses/:id |
| Delete expense | **DELETE** /groupEvents/:groupEventId/expenses/:id |

The expense GET route includes search features: in the body, a JSON object with the fields {`memberNameSearch`, 
`descriptionSearch`, `minDate`, `maxDate`} can be passed. 
* If the name search string is specified, only expenses where
the group member name of either the paying group member of one of the sharing group members matches the search string
are returned. 
* If the description search string is specified, only expenses where the description matches the search are returned.
* If minDate and/or maxDate are specified, only expenses within that date range are returned.

Note that the search by member name or description is performed "fuzzy", that means that the search string does not need
to be an exact match, but only needs to be contained in the name/description to be a match.

##### Transactions:

| Function        | Route | 
| ------------- | ------------- |
| Get list of transactions | **GET** /groupEvents/:groupEventId/transactions |
| Get list of transactions with detailed group member data | **GET** /groupEvents/:groupEventId/transactions-detailed |

## Persistence with mongoDB

The data described in the data model section is persistently stored in a mongoDB database which is hosted on mlab.
The model is implemented in three mongoose schemas and stored in three collections, *groupeventsdb*, *groupmembersdb*,
and *expensesdb*. The schemas mark several fields as required, and provide default values for the optional fields.
The database's type constraints and 'required field' constraints are also used for data validation, so most of the data
needn't be checked explicitly in the POST and PUT routes.

The server uses mongoose for communication with the database: Throughout the code, a promise-like style is used to make
use of method chaining and consistently handle errors at the end of the chain. The mongoose connection is established
only once, and exported by the module mongooseConnection (mongooseConnection.js).

Since the data model makes use of references, upon deleting group events and group members, consistency must be ensured:
When a group event is deleted, all group member and expense entries which reference the group event are also deleted.
This is implemented through a post-removal hook in the groupEvents model
However, doing a similar cascade delete for group members hardly makes sense and could easily lead to an accidental
deletion of many expenses: Deleting a group member should only be possible if there are no expenses left which reference
the group member. Therefore, the DELETE route for group members checks references and fails if the member is referenced.

## Calculating transactions
The transactions GET route offers the service of calculating a list of transactions between group members which can be
used to settle the expenses. For n group members, all expenses can be settled with only (n-1) transactions, which makes
settlement much easier than having everybody pay money to everybody else who paid a bill for them.
For calculating theses transactions, the following algorithm is used:

1. Every group member has a *balance*, on which advancements are counted positively and dues are counted negatively.
   It is calculated by splitting up every expense is split on its sharing group members and deducting this amount from
   their balance, and adding the amount of the whole expense on the balance of the paying group member.
   
2. Depending on if their balance is postive or negative, the group members are split up in two groups called *lenders*
   and *borrowers*. Group members with balance 0 are ignored.
   
3. Now, starting at the first lender `l` and the first borrower `b`, a transaction is added for paying money from `b`
   to `l`. If overall, `b` owes more money than `l` advanced, the next lender is selected and also gets money from `l`.
   Similarly, if 'l' advanced more money than `b` still owes, the next borrower is selected. This algorithm continues
   until all lenders and borrowers were processed, leading to the desired list of transactions.
   
## Git usage, deployment and testing
The project is version-controlled using git and was uploaded to GitHub as a private repository: 
https://github.com/Vuenc/Group-Bill-Splitter

The server is deployed on Heroku: https://wat2-group-bill-splitter.herokuapp.com/
The mongoDB database is deployed on mlab. The credentials for the mlab account are passed by environment variable
(which can be simulated with an .env and the dotenv package file).

The server was tested using the REST client Insomnia, where multiple routes can be stored to simplify testing.

## References
1. Mongoose documentation, including https://mongoosejs.com/docs/queries.html,
 https://mongoosejs.com/docs/middleware.html, https://mongoosejs.com/docs/promises.html
2. MongoDB documentation, including https://docs.mongodb.com/manual/core/data-model-design/,
 https://docs.mongodb.com/manual/reference/operator/query/in/, 
 https://docs.mongodb.com/manual/reference/operator/query/elemMatch/,
3. http://erikaybar.name/using-es6-promises-with-mongoosejs-queries/ about promise-like .then() functions in mongoose
 queries
4. https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose about mongoose
5. https://www.npmjs.com/package/dotenv about the doetenv package
6. https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex, answer by CoolAJ86 who
 provides a node package for escaping regex input strings
7. https://developer.mozilla.org/en-US/docs/Web/HTTP/Status, https://en.wikipedia.org/wiki/List_of_HTTP_status_codes 
 about HTTP status codes
8. https://github.com/github/gitignore/blob/master/Node.gitignore for the .gitignore template for Node.js
9. https://mrcoles.com/javascript-promises-and-errors/ about promises