## Extending the Application

This section provides guidance on how to extend the Shillong Teer application with new features, improvements, or customizations.

### Adding New Features

Follow these steps when adding new features to the application:

1. **Plan the Feature**:
   - Define requirements and user stories
   - Identify affected components
   - Design data model changes (if needed)

2. **Update Schema**:
   - Modify `shared/schema.ts` for new data models
   - Update types and validation schemas
   - Example: Adding a new "favorites" feature:
   ```typescript
   // Add new table to schema.ts
   export const favorites = pgTable("favorites", {
     id: serial("id").primaryKey(),
     userId: integer("user_id").notNull().references(() => users.id),
     number: integer("number").notNull(),
     createdAt: timestamp("created_at").notNull().defaultNow(),
   });
   
   // Add insert schema
   export const insertFavoriteSchema = createInsertSchema(favorites).pick({
     userId: true,
     number: true,
   });
   
   // Add types
   export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
   export type Favorite = typeof favorites.$inferSelect;
   ```

3. **Implement Backend**:
   - Add new routes in `server/routes.ts`
   - Update storage methods in `server/storage.ts`
   - Add validation using Zod
   - Example: Adding API routes for favorites:
   ```typescript
   // Add to server/routes.ts
   app.get('/api/favorites', async (req, res) => {
     try {
       if (!req.isAuthenticated()) {
         return res.status(401).json({ message: 'You must be logged in' });
       }
       
       const userId = (req.user as any).id;
       const favorites = await storage.getUserFavorites(userId);
       
       res.json(favorites);
     } catch (error) {
       console.error('Error fetching favorites:', error);
       res.status(500).json({ message: 'Failed to fetch favorites' });
     }
   });
   
   app.post('/api/favorites', async (req, res) => {
     try {
       if (!req.isAuthenticated()) {
         return res.status(401).json({ message: 'You must be logged in' });
       }
       
       const userId = (req.user as any).id;
       const data = insertFavoriteSchema.parse({
         ...req.body,
         userId,
       });
       
       const favorite = await storage.addFavorite(data);
       
       res.status(201).json(favorite);
     } catch (error) {
       if (error instanceof z.ZodError) {
         return res.status(400).json({ message: 'Validation failed', errors: error.errors });
       }
       console.error('Error adding favorite:', error);
       res.status(500).json({ message: 'Failed to add favorite' });
     }
   });
   
   app.delete('/api/favorites/:id', async (req, res) => {
     try {
       if (!req.isAuthenticated()) {
         return res.status(401).json({ message: 'You must be logged in' });
       }
       
       const userId = (req.user as any).id;
       const id = parseInt(req.params.id);
       
       if (isNaN(id)) {
         return res.status(400).json({ message: 'Invalid ID' });
       }
       
       const favorite = await storage.getFavorite(id);
       
       if (!favorite) {
         return res.status(404).json({ message: 'Favorite not found' });
       }
       
       if (favorite.userId !== userId) {
         return res.status(403).json({ message: 'Unauthorized' });
       }
       
       await storage.removeFavorite(id);
       
       res.json({ message: 'Favorite removed' });
     } catch (error) {
       console.error('Error removing favorite:', error);
       res.status(500).json({ message: 'Failed to remove favorite' });
     }
   });
   ```
   
   - Update storage methods:
   ```typescript
   // Add to server/storage.ts in IStorage interface
   getUserFavorites(userId: number): Promise<Favorite[]>;
   addFavorite(favorite: InsertFavorite): Promise<Favorite>;
   getFavorite(id: number): Promise<Favorite | undefined>;
   removeFavorite(id: number): Promise<void>;
   
   // Implement in MemStorage class
   async getUserFavorites(userId: number): Promise<Favorite[]> {
     return Array.from(this.favorites.values())
       .filter(favorite => favorite.userId === userId);
   }
   
   async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
     const id = ++this.currentFavoriteId;
     
     const newFavorite: Favorite = {
       id,
       ...favorite,
       createdAt: new Date(),
     };
     
     this.favorites.set(id, newFavorite);
     
     return newFavorite;
   }
   
   async getFavorite(id: number): Promise<Favorite | undefined> {
     return this.favorites.get(id);
   }
   
   async removeFavorite(id: number): Promise<void> {
     this.favorites.delete(id);
   }
   ```

4. **Implement Frontend**:
   - Create new components in `client/src/components/`
   - Add new pages in `client/src/pages/` if needed
   - Update routing in `client/src/App.tsx`
   - Add queries/mutations using React Query
   - Example: Creating a favorites component:
   ```tsx
   // client/src/components/play/FavoriteNumbers.tsx
   export default function FavoriteNumbers() {
     const { user } = useAuth();
     const { toast } = useToast();
     
     // Query to get user's favorite numbers
     const {
       data: favorites,
       isLoading,
       error,
     } = useQuery({
       queryKey: ['/api/favorites'],
       enabled: !!user,
     });
     
     // Mutation to add a favorite number
     const addFavoriteMutation = useMutation({
       mutationFn: async (number: number) => {
         const response = await fetch('/api/favorites', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({ number }),
         });
         
         if (!response.ok) {
           const error = await response.json();
           throw new Error(error.message || 'Failed to add favorite');
         }
         
         return await response.json();
       },
       onSuccess: () => {
         toast({
           title: 'Favorite added',
           description: 'Number added to favorites',
         });
         queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
       },
       onError: (error: Error) => {
         toast({
           variant: 'destructive',
           title: 'Failed to add favorite',
           description: error.message,
         });
       },
     });
     
     // Mutation to remove a favorite number
     const removeFavoriteMutation = useMutation({
       mutationFn: async (id: number) => {
         const response = await fetch(`/api/favorites/${id}`, {
           method: 'DELETE',
         });
         
         if (!response.ok) {
           const error = await response.json();
           throw new Error(error.message || 'Failed to remove favorite');
         }
       },
       onSuccess: () => {
         toast({
           title: 'Favorite removed',
           description: 'Number removed from favorites',
         });
         queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
       },
       onError: (error: Error) => {
         toast({
           variant: 'destructive',
           title: 'Failed to remove favorite',
           description: error.message,
         });
       },
     });
     
     if (isLoading) {
       return <div className="p-4">Loading favorites...</div>;
     }
     
     if (error) {
       return <div className="p-4 text-red-500">Error loading favorites</div>;
     }
     
     return (
       <div className="rounded-lg bg-gray-800 p-4">
         <h2 className="text-xl font-bold mb-4 text-white">Favorite Numbers</h2>
         
         {favorites && favorites.length === 0 ? (
           <p className="text-gray-400">No favorite numbers yet.</p>
         ) : (
           <div className="grid grid-cols-5 gap-2">
             {favorites.map((favorite) => (
               <div
                 key={favorite.id}
                 className="bg-gray-700 rounded-md p-2 text-center relative"
               >
                 <span className="text-xl font-bold text-white">
                   {favorite.number.toString().padStart(2, '0')}
                 </span>
                 <button
                   className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center"
                   onClick={() => removeFavoriteMutation.mutate(favorite.id)}
                   aria-label="Remove favorite"
                 >
                   <XIcon className="w-3 h-3 text-white" />
                 </button>
               </div>
             ))}
           </div>
         )}
         
         <div className="mt-4">
           <div className="flex items-center space-x-2">
             <Input
               type="number"
               min={0}
               max={99}
               placeholder="Add favorite (0-99)"
               value={newNumber}
               onChange={(e) => setNewNumber(parseInt(e.target.value))}
             />
             <Button
               onClick={() => {
                 if (newNumber >= 0 && newNumber <= 99) {
                   addFavoriteMutation.mutate(newNumber);
                   setNewNumber('');
                 } else {
                   toast({
                     variant: 'destructive',
                     title: 'Invalid number',
                     description: 'Please enter a number between 0 and 99',
                   });
                 }
               }}
               disabled={
                 addFavoriteMutation.isPending || removeFavoriteMutation.isPending
               }
             >
               Add
             </Button>
           </div>
         </div>
       </div>
     );
   }
   ```

5. **Testing**:
   - Test new features thoroughly
   - Verify offline functionality
   - Check for regression issues

### Enhancing Existing Features

Here are some common ways to enhance existing features:

#### Improving the Betting Interface

1. **Add Quick Selection Options**:
   ```tsx
   function QuickSelections() {
     return (
       <div className="mb-4">
         <h3 className="text-lg font-semibold mb-2 text-white">Quick Selection</h3>
         <div className="flex flex-wrap gap-2">
           <Button
             variant="outline"
             size="sm"
             onClick={() => selectLastDigits(0, 9)}
           >
             Last Digit 0-9
           </Button>
           <Button
             variant="outline"
             size="sm"
             onClick={() => selectRange(0, 9)}
           >
             Single Digits (0-9)
           </Button>
           <Button
             variant="outline"
             size="sm"
             onClick={() => selectRange(10, 19)}
           >
             10's (10-19)
           </Button>
           {/* Add more quick selection options */}
         </div>
       </div>
     );
   }
   ```

2. **Add Bet History**:
   ```tsx
   function BetHistory() {
     const { user } = useAuth();
     
     const { data: bets, isLoading } = useQuery({
       queryKey: ['/api/bets/history'],
       enabled: !!user,
     });
     
     if (isLoading) {
       return <Spinner />;
     }
     
     return (
       <div className="mt-6">
         <h3 className="text-lg font-semibold mb-2 text-white">Recent Bets</h3>
         <div className="overflow-x-auto">
           <table className="w-full text-white">
             <thead className="bg-gray-800">
               <tr>
                 <th className="p-2 text-left">Date</th>
                 <th className="p-2 text-center">Round</th>
                 <th className="p-2 text-center">Numbers</th>
                 <th className="p-2 text-right">Amount</th>
                 <th className="p-2 text-center">Status</th>
               </tr>
             </thead>
             <tbody>
               {bets?.map((bet) => (
                 <tr key={bet.id} className="border-t border-gray-800">
                   <td className="p-2">{getFormattedDate(new Date(bet.date))}</td>
                   <td className="p-2 text-center">Round {bet.round}</td>
                   <td className="p-2 text-center">
                     {bet.numbers.length > 3
                       ? `${bet.numbers.slice(0, 3).join(', ')}... (${bet.numbers.length} numbers)`
                       : bet.numbers.join(', ')}
                   </td>
                   <td className="p-2 text-right">{formatCurrency(Number(bet.amount))}</td>
                   <td className="p-2 text-center">
                     <Badge
                       variant={
                         bet.status === 'won'
                           ? 'success'
                           : bet.status === 'lost'
                           ? 'destructive'
                           : 'default'
                       }
                     >
                       {bet.status}
                     </Badge>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </div>
     );
   }
   ```

#### Enhancing Analytics

1. **Add Prediction Features**:
   ```tsx
   function PredictionFeature() {
     const { data: results } = useQuery({
       queryKey: ['/api/results'],
     });
     
     const predictions = useMemo(() => {
       if (!results || results.length < 10) {
         return [];
       }
       
       // Simple prediction based on frequency analysis
       const frequencyMap = new Map<number, number>();
       
       for (let i = 0; i < 100; i++) {
         frequencyMap.set(i, 0);
       }
       
       // Count occurrences in last 30 results
       results.slice(0, 30).forEach((result) => {
         if (result.round1 !== null) {
           frequencyMap.set(result.round1, (frequencyMap.get(result.round1) || 0) + 1);
         }
         if (result.round2 !== null) {
           frequencyMap.set(result.round2, (frequencyMap.get(result.round2) || 0) + 1);
         }
       });
       
       // Get top 5 numbers
       return Array.from(frequencyMap.entries())
         .sort((a, b) => b[1] - a[1])
         .slice(0, 5)
         .map(([number, frequency]) => ({
           number,
           frequency,
           confidence: Math.min(frequency / 5, 0.9), // Simple confidence calculation
         }));
     }, [results]);
     
     return (
       <div className="mt-6 bg-gray-800 p-4 rounded-lg">
         <h3 className="text-lg font-semibold mb-2 text-white">
           Predicted Numbers (Based on Frequency)
         </h3>
         <div className="grid grid-cols-5 gap-4">
           {predictions.map(({ number, confidence }) => (
             <div
               key={number}
               className="bg-gray-700 p-3 rounded-md text-center"
             >
               <div className="text-2xl font-bold text-white mb-1">
                 {number.toString().padStart(2, '0')}
               </div>
               <div className="text-sm text-gray-300">
                 {Math.round(confidence * 100)}% confidence
               </div>
               <Progress
                 value={confidence * 100}
                 className="mt-2"
                 indicatorColor={
                   confidence > 0.7
                     ? 'bg-green-500'
                     : confidence > 0.4
                     ? 'bg-yellow-500'
                     : 'bg-red-500'
                 }
               />
             </div>
           ))}
         </div>
         <p className="text-sm text-gray-400 mt-4">
           Predictions are based on historical data and are not guaranteed.
           Always bet responsibly.
         </p>
       </div>
     );
   }
   ```

2. **Add Pattern Recognition**:
   ```tsx
   function PatternRecognition() {
     const { data: results } = useQuery({
       queryKey: ['/api/results'],
     });
     
     const patterns = useMemo(() => {
       if (!results || results.length < 20) {
         return [];
       }
       
       // Extract valid round1 numbers
       const round1Numbers = results
         .filter((r) => r.round1 !== null)
         .map((r) => r.round1);
       
       // Look for repeating patterns (pairs, triples)
       const pairs: Record<string, number> = {};
       const triples: Record<string, number> = {};
       
       // Count pairs
       for (let i = 0; i < round1Numbers.length - 1; i++) {
         const pair = `${round1Numbers[i]}-${round1Numbers[i + 1]}`;
         pairs[pair] = (pairs[pair] || 0) + 1;
       }
       
       // Count triples
       for (let i = 0; i < round1Numbers.length - 2; i++) {
         const triple = `${round1Numbers[i]}-${round1Numbers[i + 1]}-${round1Numbers[i + 2]}`;
         triples[triple] = (triples[triple] || 0) + 1;
       }
       
       // Get top patterns
       const topPairs = Object.entries(pairs)
         .filter(([_, count]) => count > 1)
         .sort((a, b) => b[1] - a[1])
         .slice(0, 3);
       
       const topTriples = Object.entries(triples)
         .filter(([_, count]) => count > 1)
         .sort((a, b) => b[1] - a[1])
         .slice(0, 3);
       
       return {
         pairs: topPairs,
         triples: topTriples,
       };
     }, [results]);
     
     return (
       <div className="mt-6 bg-gray-800 p-4 rounded-lg">
         <h3 className="text-lg font-semibold mb-4 text-white">Pattern Recognition</h3>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <h4 className="text-md font-semibold mb-2 text-white">Number Pairs</h4>
             {patterns.pairs.length > 0 ? (
               <ul className="space-y-2">
                 {patterns.pairs.map(([pair, count]) => (
                   <li
                     key={pair}
                     className="bg-gray-700 p-2 rounded-md flex justify-between"
                   >
                     <span className="text-white">{pair}</span>
                     <Badge>{count} occurrences</Badge>
                   </li>
                 ))}
               </ul>
             ) : (
               <p className="text-gray-400">No significant pairs found.</p>
             )}
           </div>
           
           <div>
             <h4 className="text-md font-semibold mb-2 text-white">Number Sequences</h4>
             {patterns.triples.length > 0 ? (
               <ul className="space-y-2">
                 {patterns.triples.map(([triple, count]) => (
                   <li
                     key={triple}
                     className="bg-gray-700 p-2 rounded-md flex justify-between"
                   >
                     <span className="text-white">{triple}</span>
                     <Badge>{count} occurrences</Badge>
                   </li>
                 ))}
               </ul>
             ) : (
               <p className="text-gray-400">No significant sequences found.</p>
             )}
           </div>
         </div>
       </div>
     );
   }
   ```

### Code Style and Best Practices

Follow these best practices when extending the application:

#### TypeScript

- Use proper typing for all functions and components
- Define interfaces for component props
- Use type inference where appropriate
- Type API responses explicitly

```typescript
// Good example
interface User {
  id: number;
  username: string;
  balance: number;
}

function UserProfile({ user }: { user: User }) {
  return <div>{user.username}'s balance: {formatCurrency(user.balance)}</div>;
}

// API call with explicit typing
const { data } = useQuery<User[]>({
  queryKey: ['/api/users'],
});
```

#### React Components

- Use functional components with hooks
- Break down complex components into smaller ones
- Use React.memo for performance optimization
- Implement proper prop validation

```typescript
// Good example
const ResultItem = React.memo(({ result }: { result: Result }) => {
  return (
    <tr>
      <td>{getFormattedDate(new Date(result.date))}</td>
      <td className="text-center">{result.round1?.toString().padStart(2, '0') || '-'}</td>
      <td className="text-center">{result.round2?.toString().padStart(2, '0') || '-'}</td>
    </tr>
  );
});

// Parent component using the optimized child component
function ResultsList({ results }: { results: Result[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Round 1</th>
          <th>Round 2</th>
        </tr>
      </thead>
      <tbody>
        {results.map((result) => (
          <ResultItem key={result.id} result={result} />
        ))}
      </tbody>
    </table>
  );
}
```

#### API Calls

- Use React Query for data fetching
- Implement proper error handling
- Use loading states for better UX
- Invalidate queries after mutations

```typescript
// Good example
function BetForm() {
  const placeBetMutation = useMutation({
    mutationFn: async (data: BetData) => {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to place bet');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bets'] });
      
      toast({
        title: 'Bet placed successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to place bet',
        description: error.message,
      });
    },
  });
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button
        type="submit"
        disabled={placeBetMutation.isPending}
      >
        {placeBetMutation.isPending ? <Spinner /> : 'Place Bet'}
      </Button>
    </form>
  );
}
```

#### Forms

- Use React Hook Form with Zod validation
- Provide clear error messages
- Implement proper form submission handling
- Use controlled components

```typescript
// Good example
function LoginForm() {
  const loginSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  });
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Spinner /> : 'Login'}
        </Button>
      </form>
    </Form>
  );
}
```

#### Styling

- Use Tailwind CSS with the theme configuration
- Follow the established color scheme
- Ensure responsive design
- Use Shadcn UI components for consistency

```typescript
// Good example with proper styling
function Card({ title, children, className }: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "bg-gray-800 rounded-lg p-4 shadow-md",
      className
    )}>
      <h2 className="text-xl font-bold mb-4 text-white">{title}</h2>
      {children}
    </div>
  );
}
```

#### Error Handling

- Implement comprehensive error handling
- Provide user-friendly error messages
- Log errors for debugging
- Use try-catch blocks for async operations

```typescript
// Good example with proper error handling
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    
    if (!response.ok) {
      // Try to parse error message from response
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      } catch (e) {
        // If parsing fails, use status text
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}
```

By following these guidelines and best practices, you can extend the Shillong Teer application while maintaining code quality, performance, and user experience.
