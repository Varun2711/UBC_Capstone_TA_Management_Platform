# use the alpine node 20 for baseline image
FROM node:20-alpine

# set working directory
WORKDIR /app

# copy over package.json and package-lock.json to the container
COPY package*.json ./

# install dependencies
RUN npm install 

# copy over the rest of the files
COPY . .

# expose port
EXPOSE 5173

# execute run command

CMD ["npm", "run", "dev", "--", "--host"]
