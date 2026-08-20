import { GoogleGenAI, Type } from "@google/genai";
import { PlayerProfile, DietGoal, DailyDiet } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const dietPlanSchema = {
  type: Type.OBJECT,
  properties: {
    totalCalories: { type: Type.NUMBER, description: "Total calories for the day." },
    totalMacros: {
      type: Type.OBJECT,
      properties: {
        protein: { type: Type.NUMBER, description: "Total protein in grams." },
        carbs: { type: Type.NUMBER, description: "Total carbohydrates in grams." },
        fat: { type: Type.NUMBER, description: "Total fat in grams." },
      },
      required: ["protein", "carbs", "fat"],
    },
    meals: {
      type: Type.ARRAY,
      description: "Array of meals for the day.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "e.g., Breakfast, Lunch, Dinner, Snack" },
          menu: {
            type: Type.ARRAY,
            description: "List of food items for the meal.",
            items: { 
              type: Type.OBJECT,
              properties: {
                foodName: { type: Type.STRING, description: "Name of the food item." },
                calories: { type: Type.NUMBER, description: "Calories for this food item." },
                carbs: { type: Type.NUMBER, description: "Carbohydrates in grams for this food item." },
                protein: { type: Type.NUMBER, description: "Protein in grams for this food item." },
                fat: { type: Type.NUMBER, description: "Fat in grams for this food item." }
              },
              required: ["foodName", "calories", "carbs", "protein", "fat"]
            }
          },
          calories: { type: Type.NUMBER, description: "Calories for this meal." },
          macros: {
            type: Type.OBJECT,
            properties: {
              protein: { type: Type.NUMBER, description: "Protein in grams for this meal." },
              carbs: { type: Type.NUMBER, description: "Carbohydrates in grams for this meal." },
              fat: { type: Type.NUMBER, description: "Fat in grams for this meal." },
            },
            required: ["protein", "carbs", "fat"],
          },
        },
        required: ["name", "menu", "calories", "macros"],
      },
    },
  },
  required: ["totalCalories", "totalMacros", "meals"],
};

export const generateDailyDiet = async (profile: PlayerProfile, goal: DietGoal): Promise<DailyDiet> => {
    const prompt = `
        You are an expert sports nutritionist specializing in diets for professional baseball players. 
        Based on the following player profile and dietary goals, create a detailed, one-day meal plan in Korean.
        The plan should be optimized for performance, recovery, and the player's specific goals.

        Player Profile:
        - Height: ${profile.height} cm
        - Weight: ${profile.weight} kg
        - Body Fat Percentage: ${profile.bodyFatPercentage}%
        - Position: ${profile.position}
        - Allergies: ${profile.allergies}
        - Preferred Foods: ${profile.preferences}
        - Disliked Foods: ${profile.dislikes}

        Dietary Goal: ${goal.primaryGoal}

        Generate a complete one-day meal plan including breakfast, lunch, and dinner.
        For each meal, provide a list of menu items, estimated calories, and macronutrient breakdown (protein, carbs, fat in grams).
        Also provide the total estimated calories and macronutrients for the entire day.
        
        Consider nutrient timing. The post-workout meal or snack should be rich in protein and carbs for recovery.
        All text, including meal names and menu items, must be in Korean.

        Please provide the response in the specified JSON format.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: dietPlanSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const dietData = JSON.parse(jsonText);

        return dietData as DailyDiet;

    } catch (error) {
        console.error("Error generating diet plan:", error);
        throw new Error("식단 생성에 실패했습니다. API 키와 입력 매개변수를 확인해주세요.");
    }
};