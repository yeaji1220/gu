const PICTURE_PROMPT = "Describe the picture in as much detail as you can.";

const PICTURE_PROBLEMS = [
  {
    id: "pp-cafe",
    image: "images/cafe.svg",
    alt: "카페에서 두 사람이 테이블에 앉아 있고 오른쪽 계산대에 직원이 있는 그림",
    answer: "This picture seems to have been taken inside a cafe. In the middle of the picture, two people are sitting at a table. The person on the left is wearing a red shirt, and the person on the right is wearing a blue shirt. There are two coffee cups on the table, and they seem to be talking about something. On the right side of the picture, a staff member is working behind the counter. In the background, I can see a large window and a menu board. Overall, it seems like a relaxing and peaceful atmosphere."
  },
  {
    id: "pp-office",
    image: "images/office.svg",
    alt: "회의실에서 정장 입은 남자가 화이트보드의 차트를 가리키고 세 사람이 테이블에 앉아 있는 그림",
    answer: "This picture seems to have been taken in a meeting room. On the left side of the picture, a man in a suit is standing next to a whiteboard. He is pointing at a chart on the whiteboard. On the right side of the picture, three people are sitting at a table. There are some laptops on the table, and they seem to be listening to his presentation. In the background, I can see a clock and a window. It looks like they are having a meeting."
  },
  {
    id: "pp-park",
    image: "images/park.svg",
    alt: "공원에서 한 사람이 벤치에서 책을 읽고 다른 사람이 개를 산책시키는 그림",
    answer: "This picture seems to have been taken in a park. The weather looks sunny and clear. On the left side of the picture, a person is sitting on a bench and reading a book. In the middle of the picture, a man is walking his dog along the path. He is wearing a green shirt. In the background, there are some tall trees and a few clouds in the sky. Overall, it seems like a relaxing and peaceful atmosphere."
  },
  {
    id: "pp-street",
    image: "images/street.svg",
    alt: "도시 거리에서 두 사람이 횡단보도를 건너고 양옆에 차가 있는 그림",
    answer: "This picture seems to have been taken on a city street. In the middle of the picture, two people are crossing the street at a crosswalk. The traffic light is green. On the left side of the picture, there is a blue car, and on the right side, there is a red car. In the background, I can see some tall buildings. There aren't many cars on the street. Overall, the weather looks nice and clear."
  },
  {
    id: "pp-market",
    image: "images/market.svg",
    alt: "야외 시장 과일 가게에서 앞치마를 두른 상인과 바구니를 든 손님이 있는 그림",
    answer: "This picture seems to have been taken at an outdoor market. In the middle of the picture, a man wearing an apron is standing behind a fruit stand. Many fruits are on display, such as apples, oranges and bananas. On the right side of the picture, a woman is holding a basket. She is pointing at some fruit, so she seems to be choosing what to buy. At the top of the picture, there is a red and white awning. Overall, the market looks lively."
  },
  {
    id: "pp-library",
    image: "images/library.svg",
    alt: "도서관에서 한 여자가 노트북으로 일하고 한 남자가 책을 읽는 그림",
    answer: "This picture seems to have been taken in a library. On the left side of the picture, there is a large bookshelf full of books. In the middle of the picture, a woman is working on a laptop at a table. Next to her, a man is reading a book. There is a small lamp on the table. In the background, I can see a sign that says quiet please. They seem to be focusing on their work. Overall, the place looks quiet and peaceful."
  }
];

const QUESTION_PROBLEMS = [
  {
    id: "pq-coffee",
    intro: "Imagine that a marketing firm is doing research in your country. You have agreed to participate in a telephone interview about coffee shops.",
    questions: [
      { question: "How often do you go to a coffee shop, and who do you usually go with?", answer: "I go to a coffee shop two or three times a week, and I usually go with my coworkers. We often go there after lunch." },
      { question: "How long do you usually stay at a coffee shop?", answer: "I usually stay there for about an hour. I like talking with my friends while drinking coffee." },
      { question: "What is the most important thing to you when choosing a coffee shop? Why?", answer: "I think the most important thing is the location. First, I'm a busy office worker, so I don't have much time. If the coffee shop is near my office, it saves me a lot of time. In addition, I can visit it more often. That's why I prefer a coffee shop near my workplace." }
    ]
  },
  {
    id: "pq-exercise",
    intro: "Imagine that a health magazine is doing research in your area. You have agreed to participate in a telephone interview about exercise.",
    questions: [
      { question: "When was the last time you exercised, and what did you do?", answer: "The last time I exercised was last weekend. I went jogging in the park near my house." },
      { question: "Do you prefer to exercise alone or with other people? Why?", answer: "I prefer to exercise alone because I can do it whenever I want. Also, I can focus better." },
      { question: "Would you recommend joining a gym to your friends? Why or why not?", answer: "Yes, I would like to recommend it to my friends. First, it is good for their health. There are many machines, so they can do various kinds of exercise. In addition, it helps them relieve stress. For example, I feel much better after working out at the gym. That's why I recommend it." }
    ]
  },
  {
    id: "pq-shopping",
    intro: "Imagine that a marketing firm is doing research in your country. You have agreed to participate in a telephone interview about online shopping.",
    questions: [
      { question: "How often do you shop online, and what do you usually buy?", answer: "I shop online about once a week, and I usually buy clothes and household items." },
      { question: "Do you usually shop online with a smartphone or a computer? Why?", answer: "I usually use my smartphone because it is more convenient. I can shop anytime, even on the bus." },
      { question: "What are the advantages of shopping online compared to shopping at a store?", answer: "I think there are many advantages. First, it saves me a lot of time because I don't have to go to the store. Second, I can easily compare prices, so I can save money. For example, last month I bought a pair of shoes online at a much lower price. That's why I prefer shopping online." }
    ]
  },
  {
    id: "pq-movies",
    intro: "Imagine that a movie company is doing research in your area. You have agreed to participate in a telephone interview about watching movies.",
    questions: [
      { question: "When was the last time you watched a movie, and who did you watch it with?", answer: "The last time I watched a movie was last Friday. I watched it with my family at home." },
      { question: "Do you prefer to watch movies at home or in a theater? Why?", answer: "I prefer to watch movies at home because it is more comfortable. Also, I can save money." },
      { question: "What kind of movies do you like the most? Why?", answer: "I like comedy movies the most. First, they help me relieve stress. After a long day at work, watching a funny movie makes me feel good. In addition, I can enjoy them with my family. That's why comedy is my favorite genre." }
    ]
  },
  {
    id: "pq-transport",
    intro: "Imagine that your city is doing research. You have agreed to participate in a telephone interview about public transportation.",
    questions: [
      { question: "How do you usually get to work or school?", answer: "I usually take the subway to get to work. It takes about thirty minutes." },
      { question: "How much time do you spend on public transportation each day?", answer: "I spend about an hour on public transportation each day. I usually listen to music during my commute." },
      { question: "Do you think your city should spend more money on public transportation? Why or why not?", answer: "Yes, I think it's a good idea. First, many people use public transportation every day, so it would make their lives more convenient. In addition, if more people use buses and subways, there will be less traffic. It is also good for the environment. That's why I think the city should spend more on it." }
    ]
  },
  {
    id: "pq-restaurants",
    intro: "Imagine that a food magazine is doing research in your area. You have agreed to participate in a telephone interview about restaurants.",
    questions: [
      { question: "How often do you eat out, and where do you usually go?", answer: "I eat out about twice a week, and I usually go to a Korean restaurant near my house." },
      { question: "How do you usually find a new restaurant to try?", answer: "I usually find information online. I also get recommendations from my friends." },
      { question: "When choosing a restaurant, which is more important to you, the taste of the food or the price? Why?", answer: "I think the taste of the food is more important. Most of all, I eat out to enjoy delicious food. If the food is not good, I don't want to go there again, even if it's cheap. In addition, I don't eat out very often, so I don't mind paying a little more. That's why taste is more important to me." }
    ]
  },
  {
    id: "pq-smartphones",
    intro: "Imagine that a technology company is doing research in your country. You have agreed to participate in a telephone interview about smartphones.",
    questions: [
      { question: "How many hours a day do you use your smartphone?", answer: "I use my smartphone about four hours a day. I mostly use it to watch videos and send messages." },
      { question: "Which app do you use the most, and why?", answer: "I use a messaging app the most because I talk with my friends and coworkers every day." },
      { question: "Do you think children should be allowed to have smartphones? Why or why not?", answer: "I think it depends on their age, but in general, I don't agree with that. First, children can spend too much time on their smartphones. It can be a waste of time and bad for their health. Second, they can easily see harmful content online. That's why I think children should not have smartphones too early." }
    ]
  },
  {
    id: "pq-travel",
    intro: "Imagine that a travel agency is doing research in your country. You have agreed to participate in a telephone interview about traveling.",
    questions: [
      { question: "When was the last time you went on a trip, and where did you go?", answer: "The last time I went on a trip was last summer. I went to Jeju Island with my family." },
      { question: "Do you prefer to travel in your own country or abroad? Why?", answer: "I prefer to travel in my own country because it is cheaper and takes less time." },
      { question: "What do you usually consider when planning a trip? Why?", answer: "I usually consider the cost the most. I'm a busy office worker, so I can't travel very often, and I want to save money. So I search for cheap flights and hotels online. In addition, I check the reviews of the places I want to visit. That's why I can enjoy my trip without stress." }
    ]
  }
];
