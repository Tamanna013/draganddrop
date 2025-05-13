"use client"
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button'; // Import Button from Shadcn/UI
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { GripVertical, Image, Heading as ButtonIconComponent, XCircle, CheckCircle, AlertTriangle, LayoutDashboard, File } from 'lucide-react'; // Renamed to ButtonIconComponent
import { ScrollArea } from "@/components/ui/scroll-area"

// ===============================
// Types & Interfaces
// ===============================

interface DragElement {
    id: string;
    type: 'text' | 'image' | 'button' | 'heading' | 'container'; // Added container
    content: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    color?: string;
    fontSize?: number;
    fontFamily?: string;  // Added font
    fontWeight?: number; // Added font weight
    buttonType?: 'default' | 'outline' | 'secondary'; // Added for button styling
    backgroundColor?: string; // Added background color
    border?: string;       //Added border
    borderRadius?: number;
    padding?: string;
    margin?: string;
    align?: 'left' | 'center' | 'right';
    children?: string[]; // For container
}

type FormConfig = {
    [key: string]: {
        label: string;
        type: 'text' | 'textarea' | 'number' | 'select' | 'color' | 'border';
        value: any;
        options?: string[]; // For select dropdown
    };
};

// ===============================
// Constants
// ===============================

const GRID_SIZE = 20;

const INITIAL_ELEMENTS: DragElement[] = [
    { id: '1', type: 'text', content: 'Welcome to Websites.co.in', x: 20, y: 20, color: '#000000', fontSize: 16, fontFamily: 'Arial', fontWeight: 400 },
    { id: '2', type: 'heading', content: 'Build Your Website', x: 20, y: 60, color: '#222222', fontSize: 24, fontFamily: 'Arial', fontWeight: 600 },
    { id: '3', type: 'image', content: 'https://placehold.co/200x100', x: 20, y: 120, width: 200, height: 100 },
    { id: '4', type: 'button', content: 'Click Me', x: 20, y: 240, buttonType: 'default', color: '#ffffff', backgroundColor: '#007bff' },
    { id: '5', type: 'container', content: 'Container', x: 300, y: 50, width: 200, height: 150, backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: 8, padding: '16px', margin: '10px', children: [] }
];

const ELEMENT_TYPES = [
    { type: 'text', label: 'Text', icon: <p className="w-4 h-4" /> },
    { type: 'heading', label: 'Heading', icon: <h1 className="w-4 h-4" /> },
    { type: 'image', label: 'Image', icon: <Image className="w-4 h-4" /> },
    { type: 'button', label: 'Button', icon: <ButtonIconComponent className="w-4 h-4" /> }, // Use the renamed import
    { type: 'container', label: 'Container', icon: <LayoutDashboard className="w-4 h-4" /> },
];

const FONT_FAMILIES = [
    'Arial', 'Verdana', 'Times New Roman', 'Georgia', 'Courier New', 'Sans-serif', 'Serif', 'Monospace'
];
const FONT_WEIGHTS = [
    100, 200, 300, 400, 500, 600, 700, 800, 900
];

// ===============================
// Helper Functions
// ===============================

const createNewElement = (type: DragElement['type']): Omit<DragElement, 'id'> => {
    switch (type) {
        case 'text':
            return { type, content: 'New Text', x: 50, y: 50, color: '#000000', fontSize: 16, fontFamily: 'Arial', fontWeight: 400 };
        case 'heading':
            return { type, content: 'New Heading', x: 50, y: 50, color: '#222222', fontSize: 24, fontFamily: 'Arial', fontWeight: 600 };
        case 'image':
            return { type, content: 'https://placehold.co/100x100', x: 50, y: 50, width: 100, height: 100 };
        case 'button':
            return { type, content: 'New Button', x: 50, y: 50, buttonType: 'default', color: '#ffffff', backgroundColor: '#007bff' };
        case 'container':
            return { type, content: 'Container', x: 50, y: 50, width: 200, height: 150, backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: 0, padding: '0px', margin: '0px', children: [] };
        default:
            return { type: 'text', content: 'New Element', x: 50, y: 50, color: '#000000', fontSize: 16, fontFamily: 'Arial', fontWeight: 400 };
    }
};

const getFormConfig = (element: DragElement): FormConfig => {
    switch (element.type) {
        case 'text':
            return {
                content: { label: 'Text', type: 'textarea', value: element.content },
                color: { label: 'Color', type: 'color', value: element.color || '#000000' },
                fontSize: { label: 'Font Size', type: 'number', value: element.fontSize || 16 },
                fontFamily: {
                    label: 'Font Family',
                    type: 'select',
                    value: element.fontFamily || 'Arial',
                    options: FONT_FAMILIES
                },
                fontWeight: {
                    label: 'Font Weight',
                    type: 'select',
                    value: element.fontWeight || 400,
                    options: FONT_WEIGHTS
                }
            };
        case 'heading':
            return {
                content: { label: 'Text', type: 'textarea', value: element.content },
                color: { label: 'Color', type: 'color', value: element.color || '#222222' },
                fontSize: { label: 'Font Size', type: 'number', value: element.fontSize || 24 },
                fontFamily: {
                    label: 'Font Family',
                    type: 'select',
                    value: element.fontFamily || 'Arial',
                    options: FONT_FAMILIES
                },
                fontWeight: {
                    label: 'Font Weight',
                    type: 'select',
                    value: element.fontWeight || 600,
                    options: FONT_WEIGHTS
                }
            };
        case 'image':
            return {
                content: { label: 'Image URL', type: 'text', value: element.content },
                width: { label: 'Width', type: 'number', value: element.width || 100 },
                height: { label: 'Height', type: 'number', value: element.height || 100 },
            };
        case 'button':
            return {
                content: { label: 'Text', type: 'text', value: element.content },
                buttonType: {
                    label: 'Button Style',
                    type: 'select',
                    value: element.buttonType || 'default',
                    options: ['default', 'outline', 'secondary'],
                },
                color: { label: 'Text Color', type: 'color', value: element.color || '#ffffff' }, // Added color for button
                backgroundColor: { label: 'Background Color', type: 'color', value: element.backgroundColor || '#007bff' }
            };
        case 'container':
            return {
                width: { label: 'Width', type: 'number', value: element.width || 200 },
                height: { label: 'Height', type: 'number', value: element.height || 150 },
                backgroundColor: { label: 'Background Color', type: 'color', value: element.backgroundColor || '#f0f0f0' },
                border: { label: 'Border', type: 'border', value: element.border || '1px solid #ccc' },
                borderRadius: { label: 'Border Radius', type: 'number', value: element.borderRadius || 0 },
                padding: { label: 'Padding', type: 'text', value: element.padding || '0px' },
                margin: { label: 'Margin', type: 'text', value: element.margin || '0px' },
                align: {
                    label: 'Alignment',
                    type: 'select',
                    value: element.align || 'left',
                    options: ['left', 'center', 'right']
                }
            };
        default:
            return {
                content: { label: 'Content', type: 'text', value: element.content },
            };
    }
};

// ===============================
// Pre-made Components
// ===============================

const PREMADE_COMPONENTS = [
    {
        name: 'Landing Page',
        elements: [
            { id: 'lp1', type: 'heading', content: 'Welcome to Our Website', x: 50, y: 50, color: '#2c3e50', fontSize: 36, fontFamily: 'Arial', fontWeight: 700 },
            { id: 'lp2', type: 'text', content: 'Discover amazing features and services.', x: 50, y: 120, color: '#555', fontSize: 18, fontFamily: 'Arial', fontWeight: 400 },
            { id: 'lp3', type: 'button', content: 'Learn More', x: 50, y: 200, buttonType: 'default', color: '#ffffff', backgroundColor: '#3498db' },
        ],
    },
    {
        name: 'Blog Post',
        elements: [
            { id: 'bp1', type: 'heading', content: 'The Future of Web Design', x: 50, y: 50, color: '#2c3e50', fontSize: 32, fontFamily: 'Georgia', fontWeight: 700 },
            { id: 'bp2', type: 'text', content: 'Posted on January 1, 2024', x: 50, y: 100, color: '#7f8c8d', fontSize: 14, fontFamily: 'Georgia', fontWeight: 400 },
            {
                id: 'bp3', type: 'text', content: `Web design is constantly evolving.  New technologies and trends emerge every year,
                    changing the way we experience the internet.  This article explores some of the most exciting
                    developments in web design and what they mean for the future.`,
                x: 50, y: 140, color: '#34495e', fontSize: 16, fontFamily: 'Georgia', fontWeight: 400
            },
            { id: 'bp4', type: 'image', content: 'https://placehold.co/600x300', x: 50, y: 300, width: 600, height: 300 },
        ],
    },
    {
        name: 'E-commerce Product Page',
        elements: [
            { id: 'ep1', type: 'heading', content: 'Product Title', x: 50, y: 50, color: '#2c3e50', fontSize: 24, fontFamily: 'Arial', fontWeight: 600 },
            { id: 'ep2', type: 'text', content: 'Product Description:  A high-quality item for all your needs.', x: 50, y: 90, color: '#555', fontSize: 16, fontFamily: 'Arial', fontWeight: 400 },
            { id: 'ep3', type: 'image', content: 'https://placehold.co/300x300', x: 50, y: 140, width: 300, height: 300 },
            { id: 'ep4', type: 'text', content: '$25.00', x: 50, y: 460, color: '#e74c3c', fontSize: 20, fontFamily: 'Arial', fontWeight: 600 },
            { id: 'ep5', type: 'button', content: 'Add to Cart', x: 180, y: 450, buttonType: 'default', color: '#ffffff', backgroundColor: '#2ecc71' },
        ]
    }
];

// ===============================
// Main Component
// ===============================

const WebsiteBuilder = () => {
    // ===============================
    // State
    // ===============================

    const [elements, setElements] = useState<DragElement[]>(INITIAL_ELEMENTS);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null); // State for error messages
    const [showTutorial, setShowTutorial] = useState(true);
    const [activeSection, setActiveSection] = useState<'builder' | 'pages'>('builder'); // 'builder' or 'pages'

    // ===============================
    // Refs
    // ===============================
    const containerRef = useRef<HTMLDivElement>(null);
    const dragElementRef = useRef<HTMLElement | null>(null);

    // ===============================
    // Motion Values
    // ===============================

    const [draggedElement, setDraggedElement] = useState<string | null>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const handleDragStart = (id: string) => {
        const element = elements.find((el) => el.id === id);
        if (element) {
            setDraggedElement(id);
            x.set(element.x);
            y.set(element.y);
            setIsDragging(true);
        }
    };

    const handleDrag = (event: any, info: any) => {
        if (!draggedElement) return;

        let newX = info.point.x - (dragElementRef.current?.offsetWidth || 0) / 2;
        let newY = info.point.y - (dragElementRef.current?.offsetHeight || 0) / 2;

        // Snap to grid
        newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;

        x.set(newX);
        y.set(newY);
    };

    const handleDragEnd = useCallback(() => {
        if (!draggedElement) return;

        setElements((prevElements) =>
            prevElements.map((el) =>
                el.id === draggedElement ? { ...el, x: Math.round(x.get()), y: Math.round(y.get()) } : el
            )
        );
        setIsDragging(false);
        setDraggedElement(null);
    }, [draggedElement, x, y]);

    const handleElementClick = (id: string) => {
        setSelectedElementId(id);
        const element = elements.find((el) => el.id === id);
        if (element) {
            setFormConfig(getFormConfig(element));
        } else {
            setFormConfig(null); // Clear form if no element is found
        }
    };

    const handleFormChange = (key: string, value: any) => {
        setElements((prevElements) =>
            prevElements.map((el) =>
                el.id === selectedElementId ? { ...el, [key]: value } : el
            )
        );
        // Update formConfig immediately
        if (selectedElementId && formConfig) {
            setFormConfig(prevConfig => {
                const newConfig = { ...prevConfig };
                if (newConfig[key]) {
                    newConfig[key] = { ...newConfig[key], value };
                }
                return newConfig;
            });
        }
    };

    const handleAddElement = (type: DragElement['type']) => {
        try {
            const newElement = createNewElement(type);
            const id = crypto.randomUUID(); // Generate unique ID
            setElements((prevElements) => [...prevElements, { ...newElement, id }]);
            setSelectedElementId(id); // Optionally select the new element
        } catch (error: any) {
            setError(`Failed to add element: ${error.message}`); // Set error message
        }
    };

    const deleteElement = (id: string) => {
        setElements(prevElements => prevElements.filter(el => el.id !== id));
        setSelectedElementId(null);
        setFormConfig(null);
    };

    // Update element position when dragged
    useEffect(() => {
        if (draggedElement) {
            const element = elements.find((el) => el.id === draggedElement);
            if (element) {
                x.set(element.x);
                y.set(element.y);
            }
        }
    }, [draggedElement, elements, x, y]);

    const renderElement = (element: DragElement) => {
        const isSelected = selectedElementId === element.id;

        const getButtonStyle = () => {
            switch (element.buttonType) {
                case 'outline':
                    return 'border border-gray-500 bg-transparent text-gray-800 hover:bg-gray-100';
                case 'secondary':
                    return 'bg-gray-200 text-gray-700 hover:bg-gray-300';
                default:
                    return 'bg-blue-500 text-white hover:bg-blue-600';
            }
        };

        const containerStyle: React.CSSProperties = {
            backgroundColor: element.backgroundColor,
            border: element.border,
            borderRadius: element.borderRadius,
            padding: element.padding,
            margin: element.margin,
            display: 'flex',
            flexDirection: 'column',
            alignItems: element.align === 'left' ? 'flex-start' : element.align === 'center' ? 'center' : 'flex-end',
            width: element.width,
            height: element.height
        };

        return (
            <motion.div
                key={element.id}
                drag
                dragConstraints={containerRef}
                dragElastic={0.2}
                onDragStart={() => handleDragStart(element.id)}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                style={{
                    x: draggedElement === element.id ? x : element.x,
                    y: draggedElement === element.id ? y : element.y,
                    position: 'absolute',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    zIndex: isDragging ? 10 : 1,
                }}
                className={cn(
                    'transition-all duration-100',
                    isSelected && 'ring-2 ring-blue-500 ring-offset-2',
                    isDragging && 'z-10 shadow-lg'
                )}
                ref={draggedElement === element.id ? dragElementRef : null}
                onClick={() => handleElementClick(element.id)}
            >
                <div className="relative" style={element.type === 'container' ? containerStyle : {}}>
                    {/* Render element based on its type */}
                    {element.type === 'text' && (
                        <p style={{ color: element.color, fontSize: element.fontSize, fontFamily: element.fontFamily, fontWeight: element.fontWeight }}>{element.content}</p>
                    )}
                    {element.type === 'heading' && (
                        <h1 style={{ color: element.color, fontSize: element.fontSize, fontFamily: element.fontFamily, fontWeight: element.fontWeight }}>{element.content}</h1>
                    )}
                    {element.type === 'image' && (
                        <img
                            src={element.content}
                            alt="User Content"
                            style={{ width: element.width, height: element.height, objectFit: 'cover' }}
                            className="rounded-md"
                        />
                    )}
                    {element.type === 'button' && (
                        <Button className={cn(getButtonStyle())} style={{ color: element.color, backgroundColor: element.backgroundColor }}>
                            {element.content}
                        </Button>
                    )}
                    {element.type === 'container' && (
                        <div style={containerStyle} className="rounded-md">
                            {/* Render children here, if any */}
                            {element.children?.map(childId => {
                                const childElement = elements.find(el => el.id === childId);
                                return childElement ? renderElement(childElement) : null;
                            })}
                        </div>
                    )}
                    {/* Drag handle */}
                    <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-move opacity-50 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4 text-gray-500" />
                    </div>
                    {/* Delete button */}
                    {isSelected && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent element selection
                                deleteElement(element.id);
                            }}
                            className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-400 transition-all duration-200"
                        >
                            <XCircle className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </motion.div>
        );
    };

    const loadPremadeComponent = (component: { name: string; elements: DragElement[] }) => {
        // Generate new IDs for the elements to avoid conflicts
        const newElements = component.elements.map(el => ({ ...el, id: crypto.randomUUID() }));
        setElements(prevElements => [...prevElements, ...newElements]);
        // Switch to the builder view after loading
        setActiveSection('builder');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md p-4 space-y-4">
                <h2 className="text-lg font-semibold">Sections</h2>
                <div className="space-y-2">
                    <Button
                        variant={activeSection === 'builder' ? 'default' : 'outline'}
                        className="w-full flex items-center justify-start gap-2"
                        onClick={() => setActiveSection('builder')}
                    >
                        <LayoutDashboard className="w-4 h-4" /> Builder
                    </Button>
                    <Button
                        variant={activeSection === 'pages' ? 'default' : 'outline'}
                        className="w-full flex items-center justify-start gap-2"
                        onClick={() => setActiveSection('pages')}
                    >
                        <File className="w-4 h-4" /> Pages
                    </Button>
                </div>

                {activeSection === 'builder' && (
                    <>
                        <h2 className="text-lg font-semibold">Elements</h2>
                        <div className="space-y-2">
                            {ELEMENT_TYPES.map((elType) => (
                                <Button
                                    key={elType.type}
                                    variant="outline"
                                    className="w-full flex items-center justify-start gap-2"
                                    onClick={() => handleAddElement(elType.type)}
                                >
                                    {elType.icon}
                                    {elType.label}
                                </Button>
                            ))}
                        </div>
                    </>
                )}

                {activeSection === 'pages' && (
                    <>
                        <h2 className="text-lg font-semibold">Pre-made Pages</h2>
                        <ScrollArea className="h-48">
                            <div className="space-y-2">
                                {PREMADE_COMPONENTS.map((component) => (
                                    <Button
                                        key={component.name}
                                        variant="outline"
                                        className="w-full flex items-center justify-start gap-2"
                                        onClick={() => loadPremadeComponent(component)}
                                    >
                                        {component.name}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </>
                )}
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 overflow-auto relative">
                <div
                    ref={containerRef}
                    className="w-full h-full bg-gray-200 border border-gray-300 rounded-md relative overflow-hidden"
                >
                    {/* Render Elements */}
                    {elements.map(renderElement)}
                </div>
            </main>

            {/* Element Form */}
            {selectedElementId && (
                <aside className="w-72 bg-white shadow-md p-4 space-y-4">
                    <h2 className="text-lg font-semibold">Edit Element</h2>
                    {formConfig ? (
                        <div className="space-y-4">
                            {Object.entries(formConfig).map(([key, config]) => (
                                <div key={key}>
                                    <Label htmlFor={key}>{config.label}</Label>
                                    {config.type === 'text' && (
                                        <Input
                                            id={key}
                                            value={config.value}
                                            onChange={(e) => handleFormChange(key, e.target.value)}
                                        />
                                    )}
                                    {config.type === 'textarea' && (
                                        <Textarea
                                            id={key}
                                            value={config.value}
                                            onChange={(e) => handleFormChange(key, e.target.value)}
                                        />
                                    )}
                                    {config.type === 'number' && (
                                        <Input
                                            id={key}
                                            type="number"
                                            value={config.value}
                                            onChange={(e) => handleFormChange(key, parseInt(e.target.value, 10) || 0)}
                                        />
                                    )}
                                    {config.type === 'color' && (
                                        <Input
                                            id={key}
                                            type="color"
                                            value={config.value}
                                            onChange={(e) => handleFormChange(key, e.target.value)}
                                        />
                                    )}
                                    {config.type === 'select' && (
                                        <Select onValueChange={(value) => handleFormChange(key, value)} value={config.value}>
                                            <SelectTrigger id={key}>
                                                <SelectValue placeholder="Select an option" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {config.options?.map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {config.type === 'border' && (
                                        <Input
                                            id={key}
                                            value={config.value}
                                            onChange={(e) => handleFormChange(key, e.target.value)}
                                            placeholder="e.g., 1px solid #ccc"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">Select an element to edit its properties.</p>
                    )}
                </aside>
            )}

            {/* Error Message Dialog */}
            <Dialog open={!!error} onOpenChange={() => setError(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Error</DialogTitle>
                        <DialogDescription>
                            {error}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setError(null)}>
                            <CheckCircle className="mr-2 h-4 w-4" /> OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Tutorial Dialog */}
            <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Welcome to the Website Builder!</DialogTitle>
                        <DialogDescription>
                            <ol className="list-decimal list-inside space-y-2">
                                <li><strong>Add Elements:</strong> Use the sidebar on the left to add elements like Text, Headings, Images, and Buttons to your canvas.</li>
                                <li><strong>Drag and Drop:</strong> Drag elements from the sidebar onto the canvas and position them as you like.</li>
                                <li><strong>Edit Elements:</strong> Click on an element to select it and edit its properties in the right sidebar.</li>
                                <li><strong>Customize:</strong> Use the form in the right sidebar to modify the content, style, and layout of the selected element.</li>
                                <li><strong>Delete Elements:</strong> Select an element and click the <XCircle className="inline-block w-4 h-4" /> button to delete it.</li>
                                <li><strong>Grid System:</strong> Elements will snap to a grid to help you align them precisely.</li>
                                <li><strong>Pre-made Pages:</strong>  Click on "Pages" in the sidebar to access pre-designed page sections.  Add them to your project to get started quickly.</li>

                            </ol>
                            <p className="mt-4">Have fun building your website!</p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setShowTutorial(false)}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Got it!
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WebsiteBuilder;

